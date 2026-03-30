require_relative '../../spec_helper'

RSpec.describe RedmineCanvasGantt::QueryStateResolver do
  let(:project) { instance_double(Project, id: 1) }
  let(:current_user) { instance_double(User, id: 5) }
  let(:issue_scope) { double('IssueScope') }
  let(:issue_includes) { [:status] }
  let(:params) do
    ActionController::Parameters.new(
      query_id: '42',
      sort: 'subject:desc',
      group_by: 'assigned_to',
      project_ids: ['9'],
      show_subprojects: '0'
    )
  end
  let(:query) do
    instance_double(
      IssueQuery,
      id: 42,
      visible?: true,
      filters: {
        'status_id' => { operator: '=', values: %w[1 2] },
        'assigned_to_id' => { operator: '=', values: ['7'] },
        'project_id' => { operator: '=', values: ['1'] }
      },
      sort_criteria: [['subject', 'asc']],
      group_by: 'project'
    )
  end
  let(:working_query) do
    instance_double(
      IssueQuery,
      filters: { 'status_id' => { operator: '=', values: %w[1 2] }, 'assigned_to_id' => { operator: '=', values: ['7'] } },
      sort_criteria: [['subject', 'desc']],
      group_by: 'assigned_to',
      issue_ids: [12, 10]
    )
  end

  before do
    allow(IssueQuery).to receive(:find_by).with(id: '42').and_return(query)
    allow(query).to receive(:dup).and_return(working_query)
    allow(working_query).to receive(:filters=)
    allow(issue_scope).to receive(:where).and_return(issue_scope)
    allow(issue_scope).to receive(:includes).with(*issue_includes).and_return(issue_scope)
    allow(issue_scope).to receive(:to_a).and_return([])
  end

  it 'extracts supported shared state and applies url overrides' do
    resolver = described_class.new(
      project: project,
      params: params,
      current_user: current_user,
      issue_scope: issue_scope,
      issue_includes: issue_includes
    )

    result = resolver.resolve(project_ids: [1, 2])

    expect(result[:initial_state]).to include(
      query_id: 42,
      selected_status_ids: [1, 2],
      selected_assignee_ids: [7],
      selected_project_ids: ['9'],
      show_subprojects: false,
      sort_config: { key: 'subject', direction: 'desc' },
      group_by_assignee: true,
      group_by_project: false
    )
  end

  it 'warns and falls back when query_id is invalid' do
    allow(IssueQuery).to receive(:find_by).with(id: '42').and_return(nil)

    resolver = described_class.new(
      project: project,
      params: params,
      current_user: current_user,
      issue_scope: issue_scope,
      issue_includes: issue_includes
    )

    result = resolver.resolve(project_ids: [1, 2])

    expect(result[:warnings]).not_to be_empty
    expect(result[:initial_state][:query_id]).to be_nil
  end
end
