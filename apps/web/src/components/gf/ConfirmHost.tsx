"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type Opts = { title?: string; message: string; okText?: string; cancelText?: string };
let opener: ((o: Opts) => Promise<boolean>) | null = null;

/** Dialog konfirmasi global (shadcn/radix) — pengganti window.confirm. */
export function confirmDialog(message: string, opts?: Partial<Opts>): Promise<boolean> {
  if (!opener) return Promise.resolve(window.confirm(message));
  return opener({ message, ...opts });
}

export function ConfirmHost() {
  const [state, setState] = useState<{ o: Opts; resolve: (b: boolean) => void } | null>(null);

  useEffect(() => {
    opener = (o) => new Promise<boolean>((resolve) => setState({ o, resolve }));
    return () => {
      opener = null;
    };
  }, []);

  function close(b: boolean) {
    state?.resolve(b);
    setState(null);
  }

  return (
    <Dialog.Root open={!!state} onOpenChange={(v) => { if (!v) close(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-900/35 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gf-border bg-white p-4 shadow-2xl outline-none">
          <div className="flex items-start gap-3">
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <TriangleAlert className="h-[18px] w-[18px]" />
            </span>
            <div>
              <Dialog.Title className="text-[13px] font-semibold text-slate-800">
                {state?.o.title ?? "Konfirmasi"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[12px] leading-relaxed text-slate-500">
                {state?.o.message}
              </Dialog.Description>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="default" size="lg" onClick={() => close(false)}>
              {state?.o.cancelText ?? "Batal"}
            </Button>
            <Button variant="danger" size="lg" onClick={() => close(true)}>
              {state?.o.okText ?? "Ya, Lanjutkan"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
