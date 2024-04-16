projectBudget.ProjectBudgetShow.BudgetForm = class {
    constructor({ wrapper, events, settings }) {
        this.wrapper = wrapper;
        this.events = events;
        this.settings = settings
        this.$project_works_index = 0
        this['project-works-items'] = []
        this['project-budget'] = {}

        this.init_component();
    }

    init_component() {
        frappe.run_serially([
            () => this.prepare_dom(),
            () => this.init_child_components(),
            () => this.bind_events(),
            () => this.attach_shortcut(),
        ])
    }

    prepare_dom() {
        this.wrapper.append(`<section class='budget-form-container'></section>`)

        this.$component = this.wrapper.find(".budget-form-container")
    }

    async init_child_components() {

        this.$component.html(
            `<div class="form-container">
            </div>
            <div class="project-works-container-outer">
            <div>
                <h3>List of Task</h3>
            </div>
            <div class="project-works-container">
            </div>

            <div class="add-works-button">Add Project Works</div>
            </div>`
        )

        this.$form_container = this.$component.find(".form-container");
        this.$project_works = this.$component.find(".project-works-container")

        frappe.run_serially([
            () => this.render_form(),
            () => this.make_project_works_item()
        ])
    }

    bind_events() {

    }

    attach_shortcut() {

    }

    render_form() {
        const fields_to_display = this.get_form_fields("Project Budget")

        this.$form_container.html("");
        this.item_meta = frappe.get_meta("Project Budget")

        fields_to_display.forEach(async (fieldname, idx) => {
            this.$form_container.append(
                `<div class='${fieldname}-control' data-fieldname='${fieldname}'></div>`
            )

            const field_meta = this.item_meta.fields.find((df) => df.fieldname == fieldname)
            const me = this;

            this['project-budget'][`${fieldname}_control`] = frappe.ui.form.make_control({
                df: {
                    ...field_meta,
                    onchange: function () {
                        me.events.get_frm().set_value(fieldname, me['project-budget'][`${fieldname}_control`].get_value())
                    },
                },
                parent: this.$form_container.find(`.${fieldname}-control`),
                render_input: true
            });
            this['project-budget'][`${fieldname}_control`].set_value(this.events.get_frm().doc[fieldname])
        })
    }


    async make_project_works_item() {
        let index_work = this.$project_works_index
        this.$project_works.append(
            `<div class="project-works-item-${index_work}" data-indexcount ="${index_work}">
                <h4>Task ${index_work + 1}</h4>
            </div>`
        )
        let project_works_item = this.$project_works.find(`.project-works-item-${index_work}`)

        await this.make_project_work_frm(index_work)
        // if (this[`project-works-items`][index_work]["control"] == undefined) this['project-works-items'][index_work]["control"] = {}

        if (this.work_meta == undefined) this.work_meta = await frappe.get_meta("Project Work")

        let cur_works_frm = this['project-works-items'][index_work]

        const field_to_display = this.get_form_fields("Project Work")
        field_to_display.forEach((fieldname, index_detail) => {
            project_works_item.append(
                `<div class='${fieldname}-control' data-fieldname='${fieldname}' data-workindex="${index_work}"></div>`
            );

            const field_meta = this.work_meta.fields.find((df) => df.fieldname == fieldname);

            let make_meta = [];
            make_meta["index"] = index_work
            if (field_meta.fieldtype == "Table") {
                field_meta.fields = this.get_table_fields(fieldname);
                field_meta.data = [];
                make_meta["frm"] = cur_works_frm;
            }

            cur_works_frm[`${fieldname}_control`] = frappe.ui.form.make_control({
                df: {
                    ...field_meta,
                    onchange: function () {
                        let value = cur_works_frm[`${fieldname}_control`].get_value();
                        cur_works_frm.set_value(fieldname, value);
                    },
                },
                ...make_meta,
                parent: project_works_item.find(`.${fieldname}-control`),
                render_input: true,
            });
            cur_works_frm[`${fieldname}_control`].set_value(cur_works_frm.doc[fieldname]);
        })

        this.fill_index_work_order(cur_works_frm, index_work)
        this.create_field_filter_child_table(cur_works_frm["work_item_detail_control"], index_work)
        this.create_field_trigger_child_table(cur_works_frm["work_item_detail_control"], index_work)

        this.$project_works_index++
    }

    fill_index_work_order(frm, index) {
        frm.set_value("index", index)
        frm["index_control"].set_value(index)
    }

    create_field_trigger_child_table(tableControl, index) {
        tableControl.grid.fields_map.item_price.onchange = async function (event, value) {
            let result = await frappe.db.get_value("Item Price", this.doc.item_price, "price_list_rate")
            this.doc.price = result.message.price_list_rate
            this.frm.work_item_detail_control.refresh()
            // trigger on change price
            let price_df = this.frm.work_item_detail_control.grid.fields_map.price
            price_df.onchange.apply(this)
        }

        tableControl.grid.fields_map.price.onchange = async function (event, value) {
            // this.doc ==> is a project work detail (already dynamic)
            if (this.doc.quantity == undefined) return;
            // let old_price = this.doc.total_price
            this.doc.total_price = this.doc.price * this.doc.quantity
            this.frm.work_item_detail_control.refresh()

            // // update project works subtotal ?
            // this.frm.doc.total_price = this.frm.doc.total_price - old_price + this.doc.total_price
            // debugger
            // this.frm.total_price_control.set_value(this.frm.doc.total_price)
            // this.frm.total_price_control.refresh()
        }

        tableControl.grid.fields_map.quantity.onchange = function (event) {
            if (this.doc.price == undefined) return;
            this.doc.total_price = this.doc.price * this.doc.quantity
            this.frm.work_item_detail_control.refresh()
        }
    }

    create_field_filter_child_table(tableControl, index) {
        tableControl.grid.get_field("item").get_query = function (doc, dct, cdn) {
            return {
                filters: {
                    has_variants: "No"
                }
            }
        }

        tableControl.grid.get_field("item_price").get_query = function (doc, cdt, cdn) {
            var child = locals[cdt][cdn];

            return {
                filters: {
                    item_name: child.item
                }
            }
        }
    }

    make_project_work_frm(index) {
        const doctype = "Project Work"
        return new Promise((resolve) => {
            if (this['project-works-items'][index]) {
                this['project-works-items'][index] = this.get_new_frm(this['project-works-items'][index])
                resolve()
            } else {
                frappe.model.with_doctype(doctype, () => {
                    this['project-works-items'][index] = this.get_new_frm()
                    resolve()
                })
            }
        })
    }

    get_new_frm(_frm) {
        const doctype = "Project Work"
        const page = $("<div>")
        const frm = _frm || new frappe.ui.form.Form(doctype, page, false)
        const name = frappe.model.make_new_doc_and_get_name(doctype, false)
        frm.refresh(name);

        return frm
    }

    get_table_fields(fieldname) {
        if (fieldname == "work_item_detail") {
            return [
                {
                    fieldname: "item",
                    fieldtype: "Link",
                    in_list_view: true,
                    label: "Item",
                    options: "Item",
                    reqd: 1
                }, {
                    fieldname: "type",
                    fieldtype: "Link",
                    options: "Project Work Type",
                    label: "Type",
                    in_list_view: true,
                }, {
                    fieldname: "price",
                    fieldtype: "Currency",
                    label: "Price",
                    in_list_view: true,
                }, {
                    fieldname: "quantity",
                    fieldtype: "Int",
                    label: "Quantity",
                    reqd: 1,
                    non_negative: 1,
                }, {
                    fieldname: "rounded_quantity",
                    fieldtype: "Int",
                    label: "Rounded Quantity",
                    in_list_view: true,
                }, {
                    fieldname: "total_price",
                    fieldtype: "Currency",
                    label: "Total Price",
                    in_list_view: true,
                },
            ]
        }
    }

    get_form_fields(doctype) {
        let fields = []

        if (doctype == "Project Budget")
            fields = [
                "project_name",
                "project",
                "total_estimated_cost"
            ]
        else if (doctype == "Project Work")
            fields = [
                "work_title",
                "volume",
                "unit_of_measurement",
                "work_item_detail",
                "total_price",
                "index"
            ]

        return fields
    }

}