"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertTriangle, Building2 } from "lucide-react";
import { Modal } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { toast } from "sonner";
import { useUIStore } from "@/lib/store";
import { addCompany, type AddCompanyState } from "@/app/actions/crm";

export function AddCompanyModal() {
  const { quickAddOpen, setQuickAddOpen } = useUIStore();
  const [state, formAction, pending] = useActionState<AddCompanyState, FormData>(addCompany, undefined);
  const prevOk = useRef(false);

  useEffect(() => {
    if (state?.ok && !prevOk.current) {
      prevOk.current = true;
      toast.success("Company added to the CRM");
      setQuickAddOpen(false);
    }
    if (!state?.ok) {
      prevOk.current = false;
    }
  }, [state?.ok, setQuickAddOpen]);

  return (
    <Modal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} size="max-w-lg" label="Add company">
      <div className="flex items-center gap-3 mb-5">
        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-brand-gradient text-white"><Building2 className="h-5 w-5" /></div>
        <div>
          <h2 className="font-display text-lg font-bold">Add a company</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">We&apos;ll check for duplicates automatically before saving.</p>
        </div>
      </div>

      <form action={formAction} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Company name" required className="col-span-2"><Input name="name" required placeholder="Northwind Labs" /></Field>
          <Field label="Website"><Input name="website" placeholder="https://…" /></Field>
          <Field label="Primary email" required><Input name="email" type="email" required placeholder="growth@…" /></Field>
          <Field label="Industry"><Input name="industry" placeholder="AI / SaaS" /></Field>
          <Field label="Country"><Input name="country" placeholder="United States" /></Field>
        </div>

        {state?.error && !state.duplicate && (
          <p className="rounded-[10px] border border-rose-200/70 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/[0.08] dark:text-rose-300">{state.error}</p>
        )}

        {state?.duplicate && (
          <div className="rounded-[16px] border border-amber-200/70 bg-amber-50/60 dark:bg-amber-500/[0.08] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-amber-500 text-white"><AlertTriangle className="h-4 w-4" /></div>
              <div>
                <p className="text-[13px] font-bold">This company already exists</p>
                <p className="text-[12px] text-[var(--color-secondary-foreground)]">A matching record was found in DevLance CRM.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? "Adding…" : "Add company"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}