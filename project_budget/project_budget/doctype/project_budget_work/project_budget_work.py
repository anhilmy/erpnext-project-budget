# Copyright (c) 2024, https://coreinitiative.id/ and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ProjectBudgetWork(Document):
	pass

@frappe.whitelist(allow_guest=True)
def connect_project_budget_work(project_name):
	budget_doc = frappe.get_doc("Project Budget", project_name, ignore_permissions=True)
	
	project_works = frappe.get_all("Project Work", filters={"project_budget": project_name})
	existing = [x.project_work for x in budget_doc.project_works]
	print(project_works)
	print(existing)
	print(project_name)
	for work in project_works:
		if work.name in existing:
			continue
		budget_work = frappe.new_doc("Project Budget Work")
		budget_work.project_work = work.name
		budget_doc.project_works.append(budget_work)

	budget_doc.save(ignore_permissions=True)