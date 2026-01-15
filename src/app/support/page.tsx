'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalization } from "@/components/layout/localization-provider";

export default function SupportPage() {
  const { t } = useLocalization();

  const faqs = [
    {
      question: t.support.faq_q1,
      answer: t.support.faq_a1,
    },
    {
      question: t.support.faq_q2,
      answer: t.support.faq_a2,
    },
    {
      question: t.support.faq_q3,
      answer: t.support.faq_a3,
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <LifeBuoy className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-4xl font-bold font-headline">{t.support.title}</h1>
          <p className="text-lg text-muted-foreground">{t.support.description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.support.faq}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mail /> {t.support.contact}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">{t.support.contactDesc}</p>
                    <Button className="w-full" asChild>
                        <a href="mailto:support@omnicore.app">{t.support.contactEmail}</a>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
