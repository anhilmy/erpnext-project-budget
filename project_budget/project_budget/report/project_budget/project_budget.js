// Copyright (c) 2024, https://coreinitiative.id/ and contributors
// For license information, please see license.txt

frappe.query_reports["Project Budget"] = {
	filters: [
		{
			fieldname: "project_budget",
			label: __("Project Budget"),
			fieldtype: "Link",
			options: "Project Budget",
		}
	],
	tree: true,
	name_field: "item",
	parent_field: "parent_item",
	initial_depth: 3,
	formatter: function (value, row, column, data, default_formatter) {
		if (["volume", "quantity", "rounded", "price", "total_price"].includes(column.fieldname)) {
			if (value == undefined) {
				return ""
			}
		}

		value = default_formatter(value, row, column, data)
		if (data && data.bold) {
			value = value.bold();
		}
		return value
	}
};
