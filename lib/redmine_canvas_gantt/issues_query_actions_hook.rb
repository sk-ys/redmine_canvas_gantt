module RedmineCanvasGantt
  class IssuesQueryActionsHook < Redmine::Hook::ViewListener
    render_on :view_issues_index_bottom, partial: 'hooks/redmine_canvas_gantt/issues_query_actions'
  end
end
