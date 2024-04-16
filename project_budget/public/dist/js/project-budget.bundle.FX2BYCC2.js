(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // ../project_budget/project_budget/project_budget/page/project_budget_show/project_budget_controller.js
  projectBudget.ProjectBudgetShow.Controller = class {
    constructor(wrapper) {
      this.wrapper = $(wrapper).find(".layout-main-section");
      this.page = wrapper.page;
      this.settings = {};
      this.make_app();
    }
    async make_app() {
      await this.make_new_project();
      frappe.run_serially([
        this.prepare_dom(),
        this.prepare_components(),
        this.prepare_menu()
      ]);
    }
    prepare_dom() {
      this.wrapper.append(`<div class="project-budget-show-app"></div>`);
      this.$components_wrapper = this.wrapper.find(".project-budget-show-app");
    }
    prepare_components() {
      this.init_form();
    }
    prepare_menu() {
      this.page.set_secondary_action(__("Update Cost"), () => this.refresh_total_cost());
      this.page.set_primary_action(__("Save Project Budget"), () => this.create_project_budget());
      this.page.clear_menu();
      this.page.add_menu_item(__("Open Form View"));
      this.page.add_menu_item(__("Show All Project Budget"));
      this.page.add_menu_item(__("Show All Project Template"));
    }
    refresh_total_cost() {
      let total_cost = 0;
      this.budget_form["project-works-items"].forEach((elem, index_work) => {
        let work_subtotal = 0;
        elem.frm.doc.work_item_detail.forEach((row) => {
          work_subtotal += row.total_price;
        });
        elem.frm.set_value("total_price", work_subtotal);
        elem[`total_price_control`].set_value(work_subtotal);
        total_cost += work_subtotal;
      });
      this.budget_form["project-budget"][`total_estimated_cost_control`].set_value(total_cost);
      this.frm.set_value("total_estimated_cost", total_cost);
    }
    create_project_budget() {
      console.log(this.frm);
      this.budget_form["project-works-items"].forEach((elem) => {
        console.log(elem["frm"]);
      });
    }
    make_new_project() {
      return frappe.run_serially([
        () => frappe.dom.freeze(),
        () => this.make_project_budget_frm(),
        () => frappe.dom.unfreeze()
      ]);
    }
    make_project_budget_frm() {
      const doctype = "Project Budget";
      return new Promise((resolve) => {
        if (this.frm) {
          this.frm = this.get_new_frm(this.frm);
          resolve();
        } else {
          frappe.model.with_doctype(doctype, () => {
            this.frm = this.get_new_frm();
            resolve();
          });
        }
      });
    }
    get_new_frm(_frm) {
      const doctype = "Project Budget";
      const page = $("<div>");
      const frm = _frm || new frappe.ui.form.Form(doctype, page, false);
      const name = frappe.model.make_new_doc_and_get_name(doctype, false);
      frm.refresh(name);
      return frm;
    }
    init_form() {
      this.budget_form = new projectBudget.ProjectBudgetShow.BudgetForm({
        wrapper: this.$components_wrapper,
        settings: this.settings,
        events: {
          get_frm: () => this.frm
        }
      });
    }
  };

  // ../project_budget/project_budget/project_budget/page/project_budget_show/project_budget_form.js
  projectBudget.ProjectBudgetShow.BudgetForm = class {
    constructor({ wrapper, events, settings }) {
      this.wrapper = wrapper;
      this.events = events;
      this.settings = settings;
      this.$project_works_index = 0;
      this[`project-works-items`] = [];
      this["project-budget"] = {};
      this.init_component();
    }
    init_component() {
      frappe.run_serially([
        () => this.prepare_dom(),
        () => this.init_child_components(),
        () => this.bind_events(),
        () => this.attach_shortcut()
      ]);
    }
    prepare_dom() {
      this.wrapper.append(`<section class='budget-form-container'></section>`);
      this.$component = this.wrapper.find(".budget-form-container");
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
      );
      this.$form_container = this.$component.find(".form-container");
      this.$project_works = this.$component.find(".project-works-container");
      frappe.run_serially([
        () => this.render_form(),
        () => this.make_project_works_item()
      ]);
    }
    bind_events() {
    }
    attach_shortcut() {
    }
    render_form() {
      const fields_to_display = this.get_form_fields("Project Budget");
      this.$form_container.html("");
      this.item_meta = frappe.get_meta("Project Budget");
      fields_to_display.forEach(async (fieldname, idx) => {
        this.$form_container.append(
          `<div class='${fieldname}-control' data-fieldname='${fieldname}'></div>`
        );
        const field_meta = this.item_meta.fields.find((df) => df.fieldname == fieldname);
        const me = this;
        this["project-budget"][`${fieldname}_control`] = frappe.ui.form.make_control({
          df: __spreadProps(__spreadValues({}, field_meta), {
            onchange: function() {
              me.events.get_frm().set_value(fieldname, me["project-budget"][`${fieldname}_control`].get_value());
            }
          }),
          parent: this.$form_container.find(`.${fieldname}-control`),
          render_input: true
        });
        this["project-budget"][`${fieldname}_control`].set_value(this.events.get_frm().doc[fieldname]);
      });
    }
    async make_project_works_item() {
      let index_work = this.$project_works_index;
      this.$project_works.append(
        `<div class="project-works-item-${index_work}" data-indexcount ="${index_work}">
                <h4>Task ${index_work + 1}</h4>
            </div>`
      );
      let project_works_item = this.$project_works.find(`.project-works-item-${index_work}`);
      let me = this;
      if (this[`project-works-items`][index_work] == void 0)
        this["project-works-items"][index_work] = {};
      await this.make_project_work_frm(index_work);
      if (this.work_meta == void 0)
        this.work_meta = await frappe.get_meta("Project Work");
      let cur_child_frm = this["project-works-items"][index_work]["frm"];
      let cur_index = this["project-works-items"][index_work];
      const field_to_display = this.get_form_fields("Project Work");
      field_to_display.forEach((fieldname, index_detail) => {
        project_works_item.append(
          `<div class='${fieldname}-control' data-fieldname='${fieldname}' data-workindex="${index_work}"></div>`
        );
        const field_meta = this.work_meta.fields.find((df) => df.fieldname == fieldname);
        let make_meta = [];
        make_meta["index"] = index_work;
        if (field_meta.fieldtype == "Table") {
          field_meta.fields = this.get_table_fields(fieldname);
          field_meta.data = [];
          make_meta["frm"] = cur_child_frm;
        }
        cur_index[`${fieldname}_control`] = frappe.ui.form.make_control(__spreadProps(__spreadValues({
          df: __spreadProps(__spreadValues({}, field_meta), {
            onchange: function() {
              let value = cur_index[`${fieldname}_control`].get_value();
              cur_child_frm.set_value(fieldname, value);
            }
          })
        }, make_meta), {
          parent: project_works_item.find(`.${fieldname}-control`),
          render_input: true
        }));
        cur_index[`${fieldname}_control`].set_value(cur_child_frm.doc[fieldname]);
      });
      this.create_filter_child_table(cur_index["work_item_detail_control"], index_work);
      this.create_trigger_child_table(cur_index["work_item_detail_control"], index_work);
      this.$project_works_index++;
    }
    create_trigger_child_table(tableControl, index) {
      tableControl.grid.fields_map.item_price.onchange = function(event) {
        console.log(event);
      };
      tableControl.grid.fields_map.price.onchange = function(event, value) {
        if (this.doc.quantity == void 0)
          return;
        this.doc.total_price = this.doc.price * this.doc.quantity;
        this.frm.refresh_fields("work_item_detail");
        debugger;
        let index_work = this.parent("workindex");
        this["project-works-items"][index_work][`total_price_control`].set_value(this.doc.total_price);
      };
      tableControl.grid.fields_map.quantity.onchange = function(event) {
        console.log(event);
      };
    }
    create_filter_child_table(tableControl, index) {
      tableControl.grid.get_field("item").get_query = function(doc, dct, cdn) {
        return {
          filters: {
            has_variants: "No"
          }
        };
      };
      tableControl.grid.get_field("item_price").get_query = function(doc, cdt, cdn) {
        var child = locals[cdt][cdn];
        return {
          filters: {
            item_name: child.item
          }
        };
      };
    }
    make_project_work_frm(index) {
      const doctype = "Project Work";
      return new Promise((resolve) => {
        if (this["project-works-items"][index]["frm"]) {
          this["project-works-items"][index]["frm"] = this.get_new_frm(this["project-works-items"][index]["frm"]);
          resolve();
        } else {
          frappe.model.with_doctype(doctype, () => {
            this["project-works-items"][index]["frm"] = this.get_new_frm();
            resolve();
          });
        }
      });
    }
    make_project_detail_frm(index_work, index_detail) {
      const doctype = "Project Work Detail";
      if (this["project-works-items"][index_work]["work_item_detail_frm"] == void 0) {
        this["project-works-items"][index_work]["work_item_detail_frm"] = {};
      }
      return new Promise((resolve) => {
        if (this["project-works-items"][index_work]["work_item_detail_frm"][index_detail]) {
          this["project-works-items"][index_work]["work_item_detail_frm"][index_detail] = this.get_new_frm(this["project-works-items"][index_work]["work_item_detail_frm"][index_detail]);
          resolve();
        } else {
          frappe.model.with_doctype(doctype, () => {
            this["project-works-items"][index_work]["work_item_detail_frm"][index_detail] = this.get_new_frm();
            resolve();
          });
        }
      });
    }
    get_new_frm(_frm) {
      const doctype = "Project Work";
      const page = $("<div>");
      const frm = _frm || new frappe.ui.form.Form(doctype, page, false);
      const name = frappe.model.make_new_doc_and_get_name(doctype, false);
      frm.refresh(name);
      return frm;
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
          },
          {
            fieldname: "type",
            fieldtype: "Link",
            options: "Project Work Type",
            label: "Type",
            in_list_view: true
          },
          {
            fieldname: "price",
            fieldtype: "Currency",
            label: "Price",
            in_list_view: true
          },
          {
            fieldname: "quantity",
            fieldtype: "Int",
            label: "Quantity",
            reqd: 1,
            non_negative: 1
          },
          {
            fieldname: "rounded_quantity",
            fieldtype: "Int",
            label: "Rounded Quantity",
            in_list_view: true
          },
          {
            fieldname: "total_price",
            fieldtype: "Currency",
            label: "Total Price",
            in_list_view: true
          }
        ];
      }
    }
    get_form_fields(doctype) {
      let fields = [];
      if (doctype == "Project Budget")
        fields = [
          "project_name",
          "project",
          "total_estimated_cost"
        ];
      else if (doctype == "Project Work")
        fields = [
          "work_title",
          "volume",
          "unit_of_measurement",
          "work_item_detail",
          "total_price"
        ];
      return fields;
    }
  };
})();
//# sourceMappingURL=project-budget.bundle.FX2BYCC2.js.map
