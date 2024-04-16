projectBudget.ProjectBudgetShow.Controller = class {
    constructor(wrapper) {
        this.wrapper = $(wrapper).find(".layout-main-section");
        this.page = wrapper.page
        this.settings = {}
        this.make_app()
    }

    async make_app() {
        await this.make_new_project()
        frappe.run_serially([
            this.prepare_dom(),
            this.prepare_components(),
            this.prepare_menu(),
        ])
    }

    prepare_dom() {
        this.wrapper.append(`<div class="project-budget-show-app"></div>`)

        this.$components_wrapper = this.wrapper.find(".project-budget-show-app")
    }

    prepare_components() {
        this.init_form();
    }

    prepare_menu() {

        this.page.set_secondary_action(__("Update Cost"), () => this.refresh_total_cost())
        this.page.set_primary_action(__("Save Project Budget"), () => this.create_project_budget())

        this.page.clear_menu()
        this.page.add_menu_item(__("Open Form View"))
        this.page.add_menu_item(__("Show All Project Budget"))
        this.page.add_menu_item(__("Show All Project Template"))
    }

    refresh_total_cost() {
        let total_cost = 0
        this.budget_form['project-works-items'].forEach((elem, index_work) => {
            let work_subtotal = 0
            elem.frm.doc.work_item_detail.forEach((row) => {
                work_subtotal += row.total_price
            })
            elem.frm.set_value("total_price", work_subtotal)
            elem[`total_price_control`].set_value(work_subtotal)
            total_cost += work_subtotal
        })
        this.budget_form['project-budget'][`total_estimated_cost_control`].set_value(total_cost)
        this.frm.set_value("total_estimated_cost", total_cost)
    }

    create_project_budget() {
        console.log(this.frm)
        this.budget_form['project-works-items'].forEach((elem) => {
            console.log(elem['frm'])
        })
    }

    make_new_project() {
        return frappe.run_serially([
            () => frappe.dom.freeze(),
            () => this.make_project_budget_frm(),
            () => frappe.dom.unfreeze(),
        ])

    }

    make_project_budget_frm() {
        const doctype = "Project Budget";
        return new Promise((resolve) => {
            if (this.frm) {
                this.frm = this.get_new_frm(this.frm)
                resolve()
            } else {
                frappe.model.with_doctype(doctype, () => {
                    this.frm = this.get_new_frm()
                    resolve()
                })
            }
        })
    }

    get_new_frm(_frm) {
        const doctype = "Project Budget"
        const page = $("<div>")
        const frm = _frm || new frappe.ui.form.Form(doctype, page, false)
        const name = frappe.model.make_new_doc_and_get_name(doctype, false)
        frm.refresh(name);

        return frm
    }

    init_form() {
        this.budget_form = new projectBudget.ProjectBudgetShow.BudgetForm({
            wrapper: this.$components_wrapper,
            settings: this.settings,
            events: {
                get_frm: () => this.frm,
            }
        })
    }

}