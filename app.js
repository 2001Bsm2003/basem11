(() => {
  "use strict";

  const STORAGE_KEY = "adart_albrg_clean_v1";
  let subscribers = [];

  const $ = (id) => document.getElementById(id);

  function showMessage(text, type = "ok") {
    const box = $("message");
    box.textContent = text;
    box.className = "message " + type;
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => {
      box.textContent = "";
      box.className = "message";
    }, 3500);
  }

  function saveAll() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscribers));
      const check = localStorage.getItem(STORAGE_KEY);
      if (check === null) throw new Error("تعذر التحقق من الحفظ");
      return true;
    } catch (error) {
      showMessage("تعذر الحفظ على هذا الجهاز. تأكد من السماح بتخزين بيانات الموقع.", "err");
      return false;
    }
  }

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      subscribers = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(subscribers)) subscribers = [];
    } catch (error) {
      subscribers = [];
      showMessage("تعذر قراءة البيانات المحفوظة.", "err");
    }
    render();
  }

  function resetForm() {
    $("subscriberForm").reset();
    $("editId").value = "";
    $("saveBtn").textContent = "حفظ المشترك";
    $("cancelBtn").style.display = "none";
  }

  function formatAmount(value) {
    if (value === "" || value === null || value === undefined) return "—";
    return Number(value).toLocaleString("ar-IQ") + " د.ع";
  }

  function render() {
    const q = $("search").value.trim().toLowerCase();
    const filtered = subscribers.filter(s => {
      const text = [s.name, s.phone, s.account, s.plan].join(" ").toLowerCase();
      return text.includes(q);
    });

    $("totalCount").textContent = subscribers.length;
    $("paidCount").textContent = subscribers.filter(s => s.paid).length;
    $("unpaidCount").textContent = subscribers.filter(s => !s.paid).length;

    $("empty").style.display = filtered.length ? "none" : "block";

    $("list").innerHTML = filtered.map(s => `
      <article class="item">
        <div class="itemTop">
          <div>
            <div class="name">${escapeHtml(s.name)}</div>
            <div class="meta">
              <div>📱 الهاتف: ${escapeHtml(s.phone || "—")}</div>
              <div>👤 الحساب: ${escapeHtml(s.account || "—")}</div>
              <div>📶 الباقة: ${escapeHtml(s.plan || "—")}</div>
              <div>💰 المبلغ: ${formatAmount(s.amount)}</div>
              <div>📅 الاستحقاق: ${escapeHtml(s.dueDate || "—")}</div>
            </div>
          </div>
          <span class="badge ${s.paid ? "paid" : "unpaid"}">${s.paid ? "مسدّد ✓" : "غير مسدّد"}</span>
        </div>
        <div class="itemActions">
          <button class="toggle" data-action="toggle" data-id="${s.id}">${s.paid ? "إلغاء التسديد" : "تسجيل التسديد"}</button>
          <button class="edit" data-action="edit" data-id="${s.id}">تعديل</button>
          <button class="delete" data-action="delete" data-id="${s.id}">حذف</button>
        </div>
      </article>
    `).join("");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  $("subscriberForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const id = $("editId").value;
    const record = {
      id: id || String(Date.now()),
      name: $("name").value.trim(),
      phone: $("phone").value.trim(),
      account: $("account").value.trim(),
      plan: $("plan").value.trim(),
      amount: $("amount").value,
      dueDate: $("dueDate").value,
      paid: id ? Boolean(subscribers.find(s => s.id === id)?.paid) : false
    };

    if (!record.name) {
      showMessage("اكتب اسم المشترك أولاً.", "err");
      $("name").focus();
      return;
    }

    if (id) {
      subscribers = subscribers.map(s => s.id === id ? record : s);
    } else {
      subscribers.unshift(record);
    }

    if (saveAll()) {
      showMessage(id ? "تم تعديل المشترك وحفظه ✅" : "تم حفظ المشترك بنجاح ✅");
      resetForm();
      render();
    }
  });

  $("cancelBtn").addEventListener("click", resetForm);
  $("search").addEventListener("input", render);

  $("list").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;
    const index = subscribers.findIndex(s => s.id === id);
    if (index < 0) return;

    if (action === "toggle") {
      subscribers[index].paid = !subscribers[index].paid;
      if (saveAll()) {
        showMessage(subscribers[index].paid ? "تم تسجيل التسديد ✅" : "تم إلغاء التسديد");
        render();
      }
    }

    if (action === "edit") {
      const s = subscribers[index];
      $("editId").value = s.id;
      $("name").value = s.name;
      $("phone").value = s.phone;
      $("account").value = s.account;
      $("plan").value = s.plan;
      $("amount").value = s.amount;
      $("dueDate").value = s.dueDate;
      $("saveBtn").textContent = "حفظ التعديل";
      $("cancelBtn").style.display = "inline-block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (action === "delete") {
      if (!confirm("هل تريد حذف هذا المشترك؟")) return;
      subscribers.splice(index, 1);
      if (saveAll()) {
        showMessage("تم حذف المشترك وحفظ التغييرات.");
        render();
      }
    }
  });

  $("cancelBtn").style.display = "none";
  loadAll();
})();
