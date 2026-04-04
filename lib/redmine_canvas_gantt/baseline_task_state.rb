module RedmineCanvasGantt
  class BaselineTaskState
    attr_reader :issue_id, :baseline_start_date, :baseline_due_date

    def initialize(issue_id:, baseline_start_date:, baseline_due_date:)
      @issue_id = Integer(issue_id)
      @baseline_start_date = normalize_date(baseline_start_date)
      @baseline_due_date = normalize_date(baseline_due_date)
    end

    def to_storage_hash
      {
        'issue_id' => issue_id,
        'baseline_start_date' => baseline_start_date&.to_s,
        'baseline_due_date' => baseline_due_date&.to_s
      }
    end

    def to_payload_hash
      {
        issue_id: issue_id,
        baseline_start_date: baseline_start_date&.to_s,
        baseline_due_date: baseline_due_date&.to_s
      }
    end

    private

    def normalize_date(value)
      return nil if value.nil? || value.to_s.strip.empty?
      return value if value.is_a?(Date)

      Date.iso8601(value.to_s)
    end
  end
end
