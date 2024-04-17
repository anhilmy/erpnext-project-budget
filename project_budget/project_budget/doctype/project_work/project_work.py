# Copyright (c) 2024, https://coreinitiative.id/ and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ProjectWork(Document):
	pass

	def on_update(self):
		if frappe.db.exists("Project Budget Work", self.name):
			doc = frappe.get_doc("Project Budget Work", self.name)
		else:
			doc = frappe.get_doc({"doctype":"Project Budget Work", "project_work": self.name})

		doc.parent = self.project_budget
		doc.parenttype = "Project Budget"
		doc.parentfield = "project_works"
		doc.save()
