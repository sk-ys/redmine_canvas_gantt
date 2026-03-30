module RedmineCanvasGantt
  class QueryStateResolver
    DEFAULT_STATE = {
      query_id: nil,
      selected_status_ids: [],
      selected_assignee_ids: [],
      selected_project_ids: [],
      selected_version_ids: [],
      sort_config: { key: 'startDate', direction: 'asc' },
      group_by_project: true,
      group_by_assignee: false,
      show_subprojects: true
    }.freeze

    SORT_FIELD_TO_QUERY = {
      'id' => 'id',
      'subject' => 'subject',
      'projectName' => 'project',
      'trackerName' => 'tracker',
      'statusId' => 'status',
      'priorityId' => 'priority',
      'assignedToName' => 'assigned_to',
      'authorName' => 'author',
      'startDate' => 'start_date',
      'dueDate' => 'due_date',
      'estimatedHours' => 'estimated_hours',
      'ratioDone' => 'done_ratio',
      'fixedVersionName' => 'fixed_version',
      'categoryName' => 'category',
      'createdOn' => 'created_on',
      'updatedOn' => 'updated_on',
      'spentHours' => 'spent_hours'
    }.freeze
    QUERY_FIELD_TO_SORT = SORT_FIELD_TO_QUERY.invert.freeze
    URL_OVERRIDE_FILTERS = %w[status_id assigned_to_id fixed_version_id].freeze

    def initialize(project:, params:, current_user:, issue_scope:, issue_includes:)
      @project = project
      @params = params
      @current_user = current_user
      @issue_scope = issue_scope
      @issue_includes = issue_includes
      @warnings = []
    end

    def resolve(project_ids:)
      state = DEFAULT_STATE.deep_dup
      selected_project_ids = resolve_selected_project_ids(project_ids)
      state[:selected_project_ids] = selected_project_ids.map(&:to_s)
      state[:show_subprojects] = resolve_show_subprojects

      base_issue_ids, query = resolve_base_issue_ids
      state.merge!(extract_supported_state(query)) if query
      state[:query_id] = query.id if query&.id.present?

      apply_url_overrides!(state)

      issues = load_issues(
        base_issue_ids: base_issue_ids,
        project_ids: project_ids,
        selected_project_ids: selected_project_ids,
        state: state
      )

      {
        issues: issues,
        initial_state: state,
        warnings: @warnings
      }
    end

    private

    def resolve_base_issue_ids
      query_id = @params[:query_id].presence
      return [nil, nil] unless query_id

      query = IssueQuery.find_by(id: query_id)
      unless query&.visible?(@current_user)
        @warnings << "Ignored invalid query_id=#{query_id}"
        Rails.logger.warn("[redmine_canvas_gantt] invalid query_id=#{query_id} for user #{@current_user.id}")
        return [nil, nil]
      end

      working_query = query.dup
      working_query.filters = filtered_query_filters(query.filters || {})
      [working_query.issue_ids, working_query]
    rescue StandardError => e
      @warnings << "Failed to resolve query_id=#{query_id}"
      Rails.logger.warn("[redmine_canvas_gantt] query_id=#{query_id} resolution failed: #{e.class}: #{e.message}")
      [nil, nil]
    end

    def filtered_query_filters(filters)
      overrides = []
      overrides.concat(URL_OVERRIDE_FILTERS.select { |name| url_filter_values(name).present? })
      overrides << 'project_id' if @params[:project_ids].present?
      overrides << 'subproject_id' if @params.key?(:show_subprojects)
      return filters if overrides.empty?

      filters.each_with_object({}) do |(key, value), acc|
        acc[key] = value unless overrides.include?(key)
      end
    end

    def apply_url_overrides!(state)
      status_ids = parse_integer_list(url_filter_values('status_id'))
      assignee_ids = parse_integer_or_none_list(url_filter_values('assigned_to_id'))
      version_ids = parse_string_list(url_filter_values('fixed_version_id'))
      project_ids = resolve_selected_project_ids(nil)

      state[:selected_status_ids] = status_ids if status_ids.present?
      state[:selected_assignee_ids] = assignee_ids if assignee_ids.present?
      state[:selected_version_ids] = version_ids if version_ids.present?
      state[:selected_project_ids] = project_ids.map(&:to_s) if @params[:project_ids].present?
      state[:show_subprojects] = resolve_show_subprojects if @params.key?(:show_subprojects)

      url_sort = parse_sort(@params[:sort])
      state[:sort_config] = url_sort if url_sort

      case @params[:group_by].to_s
      when 'project'
        state[:group_by_project] = true
        state[:group_by_assignee] = false
      when 'assigned_to'
        state[:group_by_project] = false
        state[:group_by_assignee] = true
      when '', nil
        nil
      else
        @warnings << "Ignored unsupported group_by=#{@params[:group_by]}"
      end
    end

    def extract_supported_state(query)
      filters = query.filters || {}
      sort_config = extract_sort_config(query)

      {
        selected_status_ids: extract_filter_ids(filters['status_id']),
        selected_assignee_ids: extract_filter_ids(filters['assigned_to_id'], allow_none: true),
        selected_project_ids: extract_filter_ids(filters['project_id']).map(&:to_s),
        selected_version_ids: extract_filter_ids(filters['fixed_version_id']).map(&:to_s),
        sort_config: sort_config || DEFAULT_STATE[:sort_config].deep_dup,
        group_by_project: query.group_by.to_s == 'project',
        group_by_assignee: query.group_by.to_s == 'assigned_to',
        show_subprojects: extract_show_subprojects(filters)
      }
    end

    def extract_sort_config(query)
      first = Array(query.sort_criteria).first
      return nil unless first

      field = QUERY_FIELD_TO_SORT[first[0].to_s]
      direction = first[1].to_s
      return nil unless field && %w[asc desc].include?(direction)

      { key: field, direction: direction }
    rescue StandardError
      nil
    end

    def extract_filter_ids(filter, allow_none: false)
      return [] unless filter.is_a?(Hash)

      operator = filter[:operator] || filter['operator']
      values = Array(filter[:values] || filter['values'])

      case operator
      when '='
        values.filter_map do |value|
          if allow_none && value.to_s == 'none'
            nil
          elsif value.to_s.match?(/\A-?\d+\z/)
            value.to_i
          end
        end
      when 'o'
        IssueStatus.where(is_closed: false).pluck(:id)
      when 'c'
        IssueStatus.where(is_closed: true).pluck(:id)
      else
        []
      end
    end

    def extract_show_subprojects(filters)
      subproject_filter = filters['subproject_id']
      return DEFAULT_STATE[:show_subprojects] unless subproject_filter.is_a?(Hash)

      operator = subproject_filter[:operator] || subproject_filter['operator']
      operator != '!*'
    end

    def load_issues(base_issue_ids:, project_ids:, selected_project_ids:, state:)
      allowed_project_ids = selected_project_ids.presence || project_ids
      scope = @issue_scope.where(project_id: allowed_project_ids)
      scope = scope.where(id: base_issue_ids) if base_issue_ids
      scope = scope.where(status_id: state[:selected_status_ids]) if state[:selected_status_ids].present?
      scope = scope.where(fixed_version_id: state[:selected_version_ids]) if state[:selected_version_ids].present?
      scope = apply_assignee_filter(scope, state[:selected_assignee_ids]) if state[:selected_assignee_ids].present?
      scope = scope.includes(*@issue_includes)

      issues = scope.to_a
      issues = preserve_query_order(issues, base_issue_ids) if base_issue_ids
      sort_issues!(issues, state[:sort_config])
      issues
    end

    def apply_assignee_filter(scope, selected_assignee_ids)
      include_none = selected_assignee_ids.include?(nil)
      numeric_ids = selected_assignee_ids.compact
      return scope.where(assigned_to_id: nil) if include_none && numeric_ids.empty?
      return scope.where(assigned_to_id: numeric_ids) unless include_none

      scope.where(assigned_to_id: numeric_ids).or(scope.where(assigned_to_id: nil))
    end

    def preserve_query_order(issues, base_issue_ids)
      issue_by_id = issues.index_by(&:id)
      Array(base_issue_ids).filter_map { |id| issue_by_id[id] }
    end

    def sort_issues!(issues, sort_config)
      return if sort_config.blank?

      issues.sort_by! do |issue|
        value = issue_sort_value(issue, sort_config[:key])
        [value.nil? ? 1 : 0, value]
      end
      issues.reverse! if sort_config[:direction] == 'desc'
    end

    def issue_sort_value(issue, key)
      case key
      when 'id' then issue.id
      when 'subject' then issue.subject.to_s.downcase
      when 'projectName' then issue.project&.name.to_s.downcase
      when 'trackerName' then issue.tracker&.name.to_s.downcase
      when 'statusId' then issue.status_id
      when 'priorityId' then issue.priority_id
      when 'assignedToName' then issue.assigned_to&.name.to_s.downcase
      when 'authorName' then issue.author&.name.to_s.downcase
      when 'startDate' then issue.start_date
      when 'dueDate' then issue.due_date
      when 'estimatedHours' then issue.estimated_hours
      when 'ratioDone' then issue.done_ratio
      when 'fixedVersionName' then issue.fixed_version&.name.to_s.downcase
      when 'categoryName' then issue.category&.name.to_s.downcase
      when 'createdOn' then issue.created_on
      when 'updatedOn' then issue.updated_on
      when 'spentHours' then issue.spent_hours
      else issue.id
      end
    end

    def resolve_selected_project_ids(fallback_project_ids)
      project_ids = parse_integer_list(Array(@params[:project_ids]))
      return project_ids if project_ids.present?

      show_subprojects = resolve_show_subprojects
      return [@project.id] unless show_subprojects
      Array(fallback_project_ids || [])
    end

    def resolve_show_subprojects
      raw = @params[:show_subprojects]
      return DEFAULT_STATE[:show_subprojects] if raw.nil?

      ActiveModel::Type::Boolean.new.cast(raw)
    end

    def parse_sort(raw)
      value = raw.to_s
      return nil if value.blank?

      field, direction = value.split(':', 2)
      normalized_direction = direction.presence || 'asc'
      return nil unless SORT_FIELD_TO_QUERY.key?(field)
      return nil unless %w[asc desc].include?(normalized_direction)

      { key: field, direction: normalized_direction }
    end

    def parse_integer_list(values)
      Array(values).flat_map { |value| value.to_s.split(/[|,]/) }.filter_map do |value|
        stripped = value.strip
        stripped.to_i if stripped.match?(/\A-?\d+\z/)
      end
    end

    def parse_integer_or_none_list(values)
      Array(values).flat_map { |value| value.to_s.split(/[|,]/) }.filter_map do |value|
        stripped = value.strip
        if stripped == '_none'
          nil
        elsif stripped.match?(/\A-?\d+\z/)
          stripped.to_i
        end
      end
    end

    def parse_string_list(values)
      Array(values).flat_map { |value| value.to_s.split(/[|,]/) }.map(&:strip).reject(&:blank?).uniq
    end

    def url_filter_values(name)
      plural = "#{name.to_s.sub(/_id\z/, '')}_ids"
      Array(@params[name] || @params[plural] || @params["#{plural}[]"])
    end
  end
end
