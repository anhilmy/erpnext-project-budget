# Copyright (c) 2024, https://coreinitiative.id/ and contributors
# For license information, please see license.txt

from frappe import _
import frappe


def execute(filters=None):
    column = list_column()
    if (not filters.project_budget):
        return column, []
    data = get_data(filters.project_budget)
    return column, data


def list_column():
    return [{
        'fieldname': 'item',
        'label': _("Jenis Bahan"),
        'fieldtype': 'Data',
        'width': 150
    }, {
        'fieldname': 'volume',
        'label': _('Volume Bahan'),
        'fieldtype': 'Float',
        'width': 150
    }, {
        'fieldname': 'uom',
        'label': _('Satuan'),
        'fieldtype': 'Data',
        'width': 50
    }, {
        'fieldname': 'quantity',
        'label': _('Jumlah Bahan'),
        'fieldtype': 'Float',
        'width': 150
    }, {
        'fieldname': 'rounded',
        'label': _('Pembulatan Jumlah'),
        'fieldtype': 'Float',
        'width': 150
    }, {
        'fieldname': 'price',
        'label': _('Harga Satuan'),
        'fieldtype': 'Currency',
        'width': 150
    }, {
        'fieldname': 'total_price',
        'label': _('Harga Total'),
        'fieldtype': 'Currency',
        'width': 150
    }]


def get_data(budget_name):
    budget_doc = frappe.get_doc("Project Budget", budget_name)
    work_doc = []
    for budget_work in budget_doc.project_works:
        child = frappe.get_doc("Project Work", budget_work.name)
        work_doc.append(child)

    data = []
    for work in work_doc:
        data.append(data_from_work(work))

        for detail in work.work_item_detail:
            data.append(data_from_work_detail(detail, work))

    data.append(get_total_cost(budget_doc))
    return data


def get_total_cost(budget_doc):
    return {
        "item": _("TOTAL COST"),
        "total_price": budget_doc.total_estimated_cost,
        "bold": True
    }


def data_from_work(work_doc):
    return {
        "name": work_doc.name,
        "item": work_doc.work_title,
        "volume": float(work_doc.volume),
        "uom": work_doc.unit_of_measurement,
        "is_group": 1,
        "parent_work": "",
        "has_value": True,
    }


def data_from_work_detail(detail_doc, parent):

    uom = frappe.db.get_value("Item", detail_doc.item, "stock_uom")

    res = {
        "item": detail_doc.item,
        "uom": uom,
        "quantity": detail_doc.quantity,
        "price": detail_doc.price,
        "total_price": detail_doc.total_price,
        "is_group": 0,
        "parent_item": parent.name,
        "has_value": True,
        "indent": 1,
    }
    return res
