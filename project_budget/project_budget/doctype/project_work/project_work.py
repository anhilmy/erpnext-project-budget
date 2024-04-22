# Copyright (c) 2024, https://coreinitiative.id/ and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ProjectWork(Document):
	pass

	def on_update(self):
		if frappe.db.exists("Project Budget Work", self.name):
			# new
			doc = frappe.get_doc("Project Budget Work", self.name)
		else:
			# update
			doc = frappe.get_doc({"doctype":"Project Budget Work", "project_work": self.name})
		
		if(self.deleted == 1):
			return

		doc.parent = self.project_budget
		doc.parenttype = "Project Budget"
		doc.parentfield = "project_works"
		if self.index == None:
			self.index = 0
		doc.idx = int(self.index) + 1
		doc.save()