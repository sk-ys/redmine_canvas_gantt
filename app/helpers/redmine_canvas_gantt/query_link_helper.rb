require 'rack/utils'

module RedmineCanvasGantt
  module QueryLinkHelper
    CANVAS_GANTT_SHARED_QUERY_PARAMS = %w[set_filter f op v sort group_by show_subprojects].freeze
    module_function

    def canvas_gantt_query_action_url(base_path:, query:, request_query_parameters:)
      params = {}
      params[:query_id] = query.id if query&.persisted?
      params.merge!(filtered_canvas_gantt_query_params(request_query_parameters))

      return base_path if params.empty?

      "#{base_path}?#{Rack::Utils.build_nested_query(params)}"
    end

    def filtered_canvas_gantt_query_params(request_query_parameters)
      request_query_parameters.to_h.each_with_object({}) do |(key, value), filtered|
        next unless CANVAS_GANTT_SHARED_QUERY_PARAMS.include?(key.to_s)

        filtered[key] = deep_dup_query_param_value(value)
      end
    end

    def deep_dup_query_param_value(value)
      case value
      when Hash
        value.each_with_object({}) do |(nested_key, nested_value), duplicated|
          duplicated[nested_key] = deep_dup_query_param_value(nested_value)
        end
      when Array
        value.map { |entry| deep_dup_query_param_value(entry) }
      else
        value
      end
    end
  end
end
