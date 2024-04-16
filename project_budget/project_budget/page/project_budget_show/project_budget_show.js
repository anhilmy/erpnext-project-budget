frappe.provide('projectBudget.ProjectBudgetShow')

frappe.pages['project-budget-show'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Project Budget',
		single_column: true
	});

	frappe.require("project-budget.bundle.js", function () {
		wrapper.pos = new projectBudget.ProjectBudgetShow.Controller(wrapper);
		window.cur_pos = wrapper.pos
	})
};

