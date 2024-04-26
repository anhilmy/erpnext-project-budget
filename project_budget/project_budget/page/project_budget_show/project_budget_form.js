projectBudget.ProjectBudgetShow.BudgetForm = class {
    constructor({ wrapper, events, settings }) {
        this.wrapper = wrapper;
        this.events = events;
        this.settings = settings
        this.$project_works_index = 0
        this['project-works-items'] = []
        this['project-budget'] = {}
        this['project-budget']['deleted-task'] = []

        this.init_component()
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
                <h2>List of Work</h2>
            </div>
            <div class="project-works-container">
            </div>

            <div class="add-works-button btn btn-secondary">Add Project Works</div>
            </div>`
        )

        this.$form_container = this.$component.find(".form-container");
        this.$project_works = this.$component.find(".project-works-container")
        this.$add_works = this.$component.find(".add-works-button")

        frappe.run_serially([
            () => this.render_form(),
            () => this.project_works_item_placeholder(),
            () => this.create_field_trigger_child_table()
        ])
    }


    project_works_item_placeholder() {
        this.$project_works.append(
            `<div id="project-works-item-placeholder">
                <h3>No Project Work yet</h3>
            </div>`
        )
    }


    bind_events() {
        const me = this;

        this.$component.on("click", ".add-works-button", async function () {
            await me.make_project_works_item()
            me.events.set_default_title()
        })

        this.$project_works.on("click", ".remove-works", function () {
            const d = new frappe.ui.Dialog({
                title: "Deletion Confirmation",
                primary_action_label: "Delete",
                secondary_action_label: "Cancel",
                primary_action: () => {
                    let index = $(this).data("index")
                    let frm = me["project-works-items"][index]
                    frm.set_value("deleted", 1)
                    me.$project_works.find(`#project-works-item-${index}`).remove()
                    me.events.delete_budget_work_child(index)
                    frappe.show_alert({
                        message: `Project Work "${frm.doc.work_title}" will be deleted after you save the document`,
                        indicator: "yellow"
                    })
                    d.hide()
                },
                secondary_action: () => {
                    d.hide()
                }
            })

            d.$body.append(`<div class="frappe-confirm-message">Are you sure you want to delete this work?</div>`)
            d.standard_actions.find(".btn-primary").removeClass("btn-primary").addClass("btn-danger");

            d.show()
        })


        this.$project_works.on("click", ".link-task", function () {
            let index = $(this).data("index")
            $(this).removeClass("link-task").addClass("show-task").text("Hide Task").data("is-open", true)
            me.toggle_show_task(index, true)
            $(this).parent().find(".delete-task").css("display", "")
        })

        this.$project_works.on("click", ".show-task", function () {
            let index = $(this).data("index")
            let is_open = $(this).data("is-open")

            if (is_open) {
                $(this).text("Show Task").data("is-open", false)
            } else {
                $(this).text("Hide Task").data("is-open", true)
            }

            me.toggle_show_task(index, is_open)
        })

        this.$project_works.on("click", ".delete-task", function () {

            const d = new frappe.ui.Dialog({
                title: "Deletion Confirmation",
                primary_action_label: "Delete",
                secondary_action_label: "Cancel",
                primary_action: () => {

                    let index = $(this).data("index")
                    let work_frm = me['project-works-items'][index]
                    me['project-budget']['deleted-task'].push(work_frm.doc['task'])


                    delete work_frm["task_frm"]
                    delete work_frm.doc["task"]
                    work_frm.control.task_is_deleted = true
                    me.$project_works.find(`#project-works-item-${index}`).find(".task-form").html("")

                    $(this).css("display", "none")

                    let $show_task_btn = $(this).parent().find(".show-task")
                    $show_task_btn.removeClass("show-task").addClass("link-task").text("Link to Task").removeData("is-open")

                    frappe.show_alert({
                        message: `Task of "${work_frm.doc.work_title}" will be deleted after you save the document`,
                        indicator: "yellow"
                    })
                    d.hide()
                },
                secondary_action: () => {
                    d.hide()
                }
            })

            d.$body.append(`<div class="frappe-confirm-message">Are you sure you want to delete this task?</div>`)
            d.standard_actions.find(".btn-primary").removeClass("btn-primary").addClass("btn-danger");

            d.show()
        })

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
                    onchange: async function () {
                        me.events.get_frm().set_value(fieldname, me['project-budget'][`${fieldname}_control`].get_value())

                        if (fieldname == "project") {
                            let project_name_control = me['project-budget'][`project_name_control`]
                            let frm = me.events.get_frm()

                            if (project_name_control.get_value() == "") {
                                let result = await frappe.db.get_value("Project", frm.doc.project, "project_name")
                                let project_name = result.message.project_name
                                frm.set_value("project_name", project_name)
                                project_name_control.set_value(project_name)
                                project_name_control.refresh()
                            }
                        }
                    },
                },
                parent: this.$form_container.find(`.${fieldname}-control`),
                render_input: true
            });
            this['project-budget'][`${fieldname}_control`].set_value(this.events.get_frm().doc[fieldname])
        })
    }

    refresh_load_project_budget() {
        const budget_fields_to_change = this.get_form_fields("Project Budget")
        budget_fields_to_change.forEach((fieldname, indx) => {
            this["project-budget"][`${fieldname}_control`].set_value(this.events.get_frm().doc[`${fieldname}`])
            this["project-budget"][`${fieldname}_control`].refresh()
        })
    }

    async refresh_load_project_work() {
        let frm = this.events.get_frm()
        let me = this

        for (let i = 0; i < this.events.get_frm().doc.project_works.length; i++) {
            await me.make_project_works_item()
            this.$project_works_index++
            this.events.set_default_title()
        }
        const work_fields_to_change = this.get_form_fields("Project Work")
        for (const [index, work] of this['project-works-items'].entries()) {
            // for every form in project work items (created empty according to length of Project Work)
            // assign the empty form with order from Project Budget Work (child table)
            await work.refresh(frm.doc.project_works[index].name)

            for (const fieldname of work_fields_to_change) {
                if (fieldname == "work_item_detail") {
                    // idk why tablecontrol is the only one connected to form directly
                    // prob because make_meta from building the fields
                    // but if another field using frm parent, then that fields is not going work. 
                    continue
                }
                else if (fieldname == "index") {
                    // reset the index every time doc is loading
                    // to control case of deletion 
                    work["control"][`${fieldname}_control`].set_value(index)
                } else if (fieldname == "task") {
                    let $project_works_item = this.$project_works.find(`#project-works-item-${index}`)
                    work["control"][`${fieldname}_control`].set_value(work.doc[fieldname])
                    if (work.doc[fieldname]) {
                        let $task_button = $project_works_item.find(".link-task")
                        $task_button.removeClass("link-task").addClass("show-task").text("Show Task").data("is-open", false)
                    } else {
                        let $delete_task_button = $project_works_item.find(".delete-task")
                        $delete_task_button.css("display", "none")
                    }
                } else {
                    work["control"][`${fieldname}_control`].set_value(work.doc[fieldname])
                }
                work["control"][`${fieldname}_control`].refresh()
            }
        }
    }

    async load_task_form(frm) {
        const field_to_display = this.get_form_fields("Task")
        for (const fieldname of field_to_display) {
            if (fieldname == "depends_on") {
                continue
            }
            frm["control"][`${fieldname}_control`].set_value(frm.doc[fieldname])
            frm["control"][`${fieldname}_control`].refresh()
        }


    }

    async toggle_show_task(index, is_open) {
        let wrapper = this.$project_works.find(`#project-works-item-${index}`).find(".task-form")
        let is_task_html_loaded = $(wrapper).find("#is-loaded")
        if (!is_task_html_loaded.length) {
            // if the form is not html loaded and not opened yet
            let work_frm = this['project-works-items'][index]
            let is_create = work_frm.doc.task ? false : true


            frappe.run_serially([
                () => this.load_create_task(index, is_create),
                () => this.make_task_form_html(wrapper, index),
                () => this.load_task_form(work_frm.task_frm)
            ])
            $(wrapper).css("display", "block")



        } else {
            let task_html = wrapper
            if (is_open) {
                $(task_html).css("display", "none")
            } else {
                $(task_html).css("display", "block")
            }
        }
    }

    async load_create_task(index, is_create) {
        // if show task then is_create is false
        // if link to task then is_create is true

        // check if this index already filled with task frm
        if (this['project-works-items'][index]['task_frm']) {
            // if there are frm. high likely there are not needed to load or create task
            // just re-create the form 
            return
        }

        await this.make_task_work_frm(index)

        // if not create then fill empty frm with 
        if (!is_create) {
            let task_name = this['project-works-items'][index].doc.task
            let task = await frappe.db.get_doc("Task", task_name)
            let task_frm = this['project-works-items'][index]["task_frm"]
            await task_frm.refresh(task)
            this.events.set_default_title()
        }

    }

    async make_task_form_html(wrapper, index) {
        wrapper.html("")
        if (this.task_meta == undefined) this.task_meta = await frappe.get_meta("Task")

        let cur_task_frm = this['project-works-items'][index]['task_frm']
        cur_task_frm['control'] = {}
        let cur_control = cur_task_frm['control']
        const field_to_display = this.get_form_fields("Task")
        for (const fieldname of field_to_display) {
            wrapper.append(
                `<div class='${fieldname}-control' data-fieldname='${fieldname}' data-workindex="${index}"></div>`
            )

            const field_meta = this.task_meta.fields.find((df) => df.fieldname == fieldname);

            let control_meta = []
            if (field_meta.fieldtype == "Table") {
                field_meta.data = [];
                control_meta.frm = cur_task_frm
            }

            cur_control[`${fieldname}_control`] = frappe.ui.form.make_control({
                df: {
                    ...field_meta,
                    onchange: function () {
                        let value = cur_control[`${fieldname}_control`].get_value();
                        cur_task_frm.set_value(fieldname, value);
                    }
                },
                ...control_meta,
                parent: wrapper.find(`.${fieldname}-control`),
                render_input: true,
            })
            if (fieldname != "depends_on") {
                cur_control[`${fieldname}_control`].set_value(cur_task_frm.doc[fieldname])
            }
        }
        wrapper.append(`<hr id="is-loaded"></hr>`)
    }



    async make_project_works_item() {
        let index_work = this.$project_works_index
        if (index_work == 0) {
            this.$project_works.html("")
        }

        this.$project_works.append(
            `<div id="project-works-item-${index_work}">
                <div class="project-works-header"> 
                    <div class="header-title">
                        <h4>Work ${index_work + 1}</h4>
                    </div>
                    <div class="header-button">
                        <div class="link-task btn btn-secondary btn-sm" data-index="${index_work}">
                            Link to Task
                        </div>
                        <div class="delete-task btn btn-secondary btn-sm" data-index="${index_work}">
                            Delete Task
                        </div>
                        <div class="remove-works btn btn-danger btn-sm" data-index="${index_work}">
                            <i class="fa fa-trash" aria-hidden="true"></i>
                        </div>
                    </div>    
                </div>
                <div class="task-form">
                </div>
                <div class="project-works-body">
                </div>
            </div>
            <hr>`
        )
        let project_works_item = this.$project_works.find(`#project-works-item-${index_work}`).find('.project-works-body')

        await this.make_project_work_frm(index_work)

        if (this.work_meta == undefined) this.work_meta = await frappe.get_meta("Project Work")

        let cur_works_frm = this['project-works-items'][index_work]
        cur_works_frm["control"] = {}
        let cur_works_control = cur_works_frm["control"]

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

            if (fieldname == "task") {
                field_meta.hidden = 1
            }

            cur_works_control[`${fieldname}_control`] = frappe.ui.form.make_control({
                df: {
                    ...field_meta,
                    onchange: function () {
                        let value = cur_works_control[`${fieldname}_control`].get_value();
                        cur_works_frm.set_value(fieldname, value);
                    },
                },
                ...make_meta,
                parent: project_works_item.find(`.${fieldname}-control`),
                render_input: true,
            });

            // if there are any initial value? idk how this work. its on the example.
            if (fieldname != "work_item_detail") {
                // so work item detail is not deleted in get_doc locals
                cur_works_control[`${fieldname}_control`].set_value(cur_works_frm.doc[fieldname]);
            }
        })

        this.fill_index_work_order(cur_works_frm, index_work)
        // idk why for filter its need to be applied for every docname 
        this.create_field_filter_child_table(cur_works_control["work_item_detail_control"], index_work)
    }

    fill_index_work_order(frm, index) {
        frm.set_value("index", index)
        frm["control"]["index_control"].set_value(index)
    }

    create_field_trigger_child_table() {
        let me = this

        frappe.ui.form.on("Project Work Detail", {
            item_price: async function (frm, cdt, cdn) {
                let child_doc = locals[cdt][cdn]
                let result = await frappe.db.get_value("Item Price", child_doc.item_price, "price_list_rate")
                frappe.model.set_value(cdt, cdn, "price", result.message.price_list_rate)
                cur_frm.script_manager.trigger("quantity", "Project Work Detail", cdn)
                frm.control.work_item_detail_control.refresh()
            },
            price: function (frm, cdt, cdn) {
                let child_doc = locals[cdt][cdn]
                if (child_doc.quantity == undefined) return;

                let total_price = child_doc.price * child_doc.rounded_quantity
                frappe.model.set_value(cdt, cdn, "total_price", total_price)
                frm.control.work_item_detail_control.refresh()
            },
            quantity: async function (frm, cdt, cdn) {
                let child_doc = locals[cdt][cdn]
                if (!child_doc.price && !child_doc.item_price) return;

                let uom_whole = await frappe.db.get_value("UOM", child_doc.unit_of_measurement, "must_be_whole_number")
                uom_whole = uom_whole.message.must_be_whole_number
                let rounded_quantity = child_doc.quantity
                if (uom_whole == 1) {
                    rounded_quantity = Math.ceil(child_doc.quantity)
                }
                frappe.model.set_value(cdt, cdn, "rounded_quantity", rounded_quantity)

                let total_price = child_doc.price * child_doc.rounded_quantity
                frappe.model.set_value(cdt, cdn, "total_price", total_price)
                frm.control.work_item_detail_control.refresh()
            }
        })
    }

    create_field_filter_child_table(tableControl, index) {
        // idk why for filter its need to be applied from get_query, not using script_manager 

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

    async make_task_work_frm(index) {
        const doctype = "Task"
        let doc_frm = this["project-works-items"][index]
        return await new Promise((resolve) => {
            if (doc_frm["task_frm"]) {
                doc_frm["task_frm"] = this.get_new_frm(doctype, doc_frm["task_frm"])
                resolve()
            } else {
                frappe.model.with_doctype(doctype, () => {
                    doc_frm["task_frm"] = this.get_new_frm(doctype)
                    resolve()
                })
            }
        })
    }

    async make_project_work_frm(index) {
        const doctype = "Project Work"
        return await new Promise((resolve) => {
            if (this['project-works-items'][index]) {
                this['project-works-items'][index] = this.get_new_frm(doctype, this['project-works-items'][index])
                resolve()
            } else {
                frappe.model.with_doctype(doctype, () => {
                    this['project-works-items'][index] = this.get_new_frm(doctype)
                    resolve()
                })
            }
        })
    }

    get_new_frm(doctype, _frm) {
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
                "project",
                "project_name",
                "total_estimated_cost"
            ]
        else if (doctype == "Project Work")
            fields = [
                "work_title",
                "volume",
                "unit_of_measurement",
                "work_item_detail",
                "total_price",
                "index",
                "task"
            ]
        else if (doctype == "Task")
            fields = [
                "subject",
                "issue",
                "color",
                "status",
                "priority",
                "task_weight",
                "parent_task",
                "completed_by",
                "completed_on",
                "exp_start_date",
                "expected_time",
                "exp_end_date",
                "progress",
                "duration",
                "is_milestone",
                "description",
                "depends_on"
            ]

        return fields
    }

}