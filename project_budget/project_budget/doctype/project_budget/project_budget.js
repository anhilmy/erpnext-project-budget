// Copyright (c) 2024, https://coreinitiative.id/ and contributors
// For license information, please see license.txt

frappe.ui.form.on("Project Budget", {
    refresh(frm) {
        frm.add_custom_button("Show Detail", function () {
            frappe.set_route("project-budget-show", frm.doc.name)
        })
    },
});
