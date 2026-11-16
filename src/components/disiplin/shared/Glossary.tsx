"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Glossary() {
  return (
    <Accordion type="single" collapsible className="glass rounded-2xl px-4">
      <AccordionItem value="g1" className="border-0">
        <AccordionTrigger className="text-base font-semibold">
          Apa maksud ini?
        </AccordionTrigger>
        <AccordionContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground">Merit</p>
            <p>
              Mata ganjaran untuk akhlak baik, contohnya membantu rakan,
              menghafal tambahan, atau menjadi imam. Mata merit membantu
              menampung demerit (penebusan).
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Demerit</p>
            <p>
              Mata pelanggaran disiplin, contohnya lewat, ponteng, atau
              tingkah laku tidak sihat. Demerit berat (SANGAT_BERAT) perlu
              diluluskan oleh HEM sebelum dipaparkan kepada ibu bapa.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Mata Bersih</p>
            <p>
              Merit tolak demerit. Ia menunjukkan baki ganjaran bersih murid
              untuk tempoh semasa.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Tahap Disiplin</p>
            <p>
              Ditentukan daripada jumlah demerit. Tahap dari Cemerlang ke
              Kritikal menentukan tindakan madrasah — tahniah, amaran bertulis,
              panggilan ibu bapa, atau rujukan kepada jawatankuasa disiplin.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Peratus Kehadiran</p>
            <p>
              (Hadir + Lewat) ÷ jumlah hari sekolah. Hadir dan lewat dikira
              sebagai kehadiran; yang lain dikira sebagai tidak hadir.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
