import type { Metadata } from "next";
import { CheckCircle2, Clock } from "lucide-react";
import { requireUser } from "@/lib/data";
import { AUTOMATIONS, QUOTE_REMINDER_STEPS } from "@/lib/automations/registry";
import { renderQuoteReminder, sampleEmailData } from "@/lib/email/templates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { ProfileForm } from "@/components/app/profile-form";
import { EmailPreview } from "@/components/app/email-preview";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const { profile } = await requireUser();

  const sample = sampleEmailData({
    companyName: profile.company_name,
    contactName: profile.contact_name,
    phone: profile.phone,
    replyTo: profile.reply_to_email || profile.email,
  });

  const previews = QUOTE_REMINDER_STEPS.map((step) => {
    const rendered = renderQuoteReminder(step.emailType, sample);
    return { key: step.emailType, label: step.label, subject: rendered.subject, html: rendered.html };
  });

  return (
    <>
      <PageHeader title="Paramètres" description="Ces informations apparaissent dans les e-mails envoyés à vos clients." />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entreprise</CardTitle>
              <CardDescription>Compte : {profile.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Automatisations</CardTitle>
              <CardDescription>Ce qui tourne pour vous, et ce qui arrive bientôt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {AUTOMATIONS.map((a) => (
                <div key={a.key} className="flex items-start gap-3 rounded-lg border p-3">
                  {a.available ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{a.label}</p>
                      <Badge variant={a.available ? "signed" : "secondary"}>
                        {a.available ? "Active" : "Bientôt"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aperçu des e-mails</CardTitle>
            <CardDescription>Exemple avec un client fictif. Enregistrez le profil pour actualiser.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmailPreview emails={previews} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
