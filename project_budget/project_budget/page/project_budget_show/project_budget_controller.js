projectBudget.ProjectBudgetShow.Controller = class {
    constructor(wrapper) {
        this.wrapper = $(wrapper).find(".layout-main-section");
        this.page = wrapper.page
        this.settings = {}

        this.budget_name = window.location.pathname.split("/").pop()
        if (this.budget_name == "project-budget-show") {
            this.budget_name = undefined
        }

        this.make_app()


    }

    make_app() {
        frappe.run_serially([
            () => this.make_new_project(),
            () => this.prepare_dom(),
            () => this.prepare_components(),
            () => this.prepare_menu(),
            () => this.load_project()
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
        this.page.set_secondary_action(__("Recalculate Price"), () => this.refresh_total_cost())
        this.page.set_primary_action(__("Save"), () => this.create_project_budget())

        this.page.clear_menu()
        this.page.add_menu_item(__("Open Form View"))
        this.page.add_menu_item(__("Show All Project Budget"))
        this.page.add_menu_item(__("Show All Project Template"))
    }

    refresh_total_cost() {
        let total_cost = 0
        this.budget_form['project-works-items'].forEach((elem, index_work) => {
            let work_subtotal = 0
            elem.doc.work_item_detail.forEach((row) => {
                work_subtotal += row.total_price
            })
            elem.set_value("total_price", work_subtotal)
            elem['control'][`total_price_control`].set_value(work_subtotal)
            total_cost += work_subtotal
            elem['control']['total_price_control'].refresh()
        })
        this.budget_form['project-budget'][`total_estimated_cost_control`].set_value(total_cost)
        this.frm.set_value("total_estimated_cost", total_cost)
        this.budget_form['project-budget']['total_estimated_cost_control'].refresh()
    }

    create_project_budget() {
        let me = this
        me.refresh_total_cost()
        this.frm.dirty()
        this.frm.save().then(async r => {
            me.budget_form['project-works-items'].forEach((elem, index) => {
                elem.set_value("project_budget", me.frm.doc.name)
                elem.save()
            })
        })
    }

    async load_project() {
        if (this.budget_name == undefined) return;

        await frappe.db.get_doc("Project Budget", this.budget_name)

        console.log("refreshing");
        this.frm.refresh(this.budget_name)

        let project_works = await frappe.db.get_list("Project Work", { filters: { project_budget: this.frm.doc.name } })

        let get_work_doc = new Promise((resolve, reject) => {
            project_works.forEach(async (work, index, array) => {
                await frappe.db.get_doc("Project Work", work.name)
                if (index === array.length - 1) resolve();
            })
        })

        get_work_doc.then(() => {
            this.budget_form.refresh_load_project()
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
                create_link_task: (works_name) => {
                    console.log(`try to create link to task from works ${works_name}`)
                },
                get_budget_name: () => this.budget_name
            }
        })
    }

}