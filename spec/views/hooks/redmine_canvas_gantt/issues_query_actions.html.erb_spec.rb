require_relative '../../../../spec_helper'

RSpec.describe 'hooks/redmine_canvas_gantt/_issues_query_actions.html.erb', type: :view do
  let(:project) { instance_double(Project) }
  let(:user) { instance_double(User) }

  before do
    allow(User).to receive(:current).and_return(user)
    allow(view).to receive(:project_path).with(project).and_return('/projects/demo')
  end

  it 'renders a Canvas Gantt link for persisted queries' do
    query = instance_double(IssueQuery, persisted?: true, id: 42)
    allow(user).to receive(:allowed_to?).with(:view_canvas_gantt, project).and_return(true)

    render partial: 'hooks/redmine_canvas_gantt/issues_query_actions', locals: { project: project, query: query }

    expect(rendered).to include('canvas-gantt-query-action-link')
    expect(rendered).to include('/projects/demo/canvas_gantt?query_id=42')
    expect(rendered).to include(I18n.t(:label_open_in_canvas_gantt))
  end

  it 'renders a save notice for unsaved queries' do
    query = instance_double(IssueQuery, persisted?: false)
    allow(user).to receive(:allowed_to?).with(:view_canvas_gantt, project).and_return(true)

    render partial: 'hooks/redmine_canvas_gantt/issues_query_actions', locals: { project: project, query: query }

    expect(rendered).to include('canvas-gantt-query-action-notice')
    expect(rendered).to include(I18n.t(:label_canvas_gantt_query_requires_save))
  end

  it 'renders nothing without Canvas Gantt permission' do
    query = instance_double(IssueQuery, persisted?: true, id: 42)
    allow(user).to receive(:allowed_to?).with(:view_canvas_gantt, project).and_return(false)

    render partial: 'hooks/redmine_canvas_gantt/issues_query_actions', locals: { project: project, query: query }

    expect(rendered.strip).to eq('')
  end
end
