import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  Bell,
  CheckCircle,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: AlertCircle,
    title: "Instant Failure Detection",
    description:
      "Stripe webhooks are processed in real-time. Every payment_intent.payment_failed and invoice.payment_failed event is captured and normalized instantly.",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: Bell,
    title: "Multi-Channel Alerts",
    description:
      "Get notified via email (Resend) and WhatsApp (Twilio) the moment a payment fails. Configure thresholds so you only hear about failures that matter.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description:
      "Understand exactly why payments fail. Breakdown by decline code, customer, product, and time. See your checkout funnel and identify drop-off points.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: TrendingUp,
    title: "Revenue Recovery",
    description:
      "Track open failures, mark them recovered when retried, and measure your recovery rate. Know exactly how much revenue is at risk.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Shield,
    title: "Checkout Tracking",
    description:
      "Embed tracker.js on your site to see your full checkout funnel — from page views to payment success or failure. Catch abandonment before it happens.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Zap,
    title: "Built for Scale",
    description:
      "Powered by BullMQ + Redis for async job processing. Multi-tenant architecture with per-org Stripe connections. Production-ready from day one.",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For early-stage startups",
    features: [
      "Up to 100 failures/mo",
      "Email notifications",
      "7-day retention",
      "1 workspace",
    ],
    cta: "Get started free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "$29",
    period: "per month",
    description: "For growing SaaS businesses",
    features: [
      "Up to 2,000 failures/mo",
      "Email + WhatsApp",
      "30-day retention",
      "3 workspaces",
      "Checkout funnel tracking",
      "CSV export",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Growth",
    price: "$99",
    period: "per month",
    description: "For scaling companies",
    features: [
      "Unlimited failures",
      "All channels",
      "90-day retention",
      "Unlimited workspaces",
      "API access",
      "Priority support",
      "Custom webhooks",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
];

const stats = [
  { value: "$2.8M", label: "Revenue recovered" },
  { value: "12,000+", label: "Failures tracked" },
  { value: "94%", label: "Avg recovery rate" },
  { value: "< 1s", label: "Alert latency" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">Recoverly</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#pricing" className="hover:text-gray-900">Pricing</a>
            <a href="#docs" className="hover:text-gray-900">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50/50 px-6 py-24 text-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-4xl">
          <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200">
            Stripe-native payment recovery
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 md:text-7xl">
            Stop losing revenue to{" "}
            <span className="text-red-600">failed payments</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Recoverly catches every Stripe payment failure, alerts your team
            instantly, and helps you recover lost revenue — all in one
            dashboard.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base">
                Start recovering revenue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                See how it works
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Free forever plan available. No credit card required.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-gray-900 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-extrabold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">
              Features
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900">
              Everything you need to recover revenue
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              From detection to recovery — Recoverly handles the complete
              payment failure lifecycle.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-6`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">
              Up and running in 5 minutes
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Connect Stripe",
                description:
                  "Add our webhook URL to your Stripe dashboard and paste your signing secret. Takes 2 minutes.",
                icon: Zap,
              },
              {
                step: "2",
                title: "Configure Alerts",
                description:
                  "Add email and WhatsApp recipients. Set minimum failure thresholds so you only get notified when it matters.",
                icon: Bell,
              },
              {
                step: "3",
                title: "Recover Revenue",
                description:
                  "Watch failures come in, reach out to customers, and mark them recovered. Your recovery rate goes up automatically.",
                icon: TrendingUp,
              },
            ].map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white mb-6">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-3 text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
              Pricing
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Start free. Upgrade when you need it.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 ${
                  plan.highlighted
                    ? "border-primary bg-primary text-white shadow-xl scale-105"
                    : "bg-white shadow-sm"
                }`}
              >
                <div className="mb-6">
                  <p
                    className={`font-semibold ${
                      plan.highlighted ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {plan.name}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span
                      className={
                        plan.highlighted ? "text-blue-200" : "text-gray-500"
                      }
                    >
                      /{plan.period}
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-sm ${
                      plan.highlighted ? "text-blue-100" : "text-gray-600"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle
                        className={`h-4 w-4 flex-shrink-0 ${
                          plan.highlighted ? "text-blue-200" : "text-green-500"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.highlighted ? "text-blue-50" : "text-gray-700"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-white text-primary hover:bg-blue-50"
                        : ""
                    }`}
                    variant={plan.highlighted ? "outline" : "default"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold text-white">
            Ready to recover your revenue?
          </h2>
          <p className="mt-6 text-xl text-gray-400">
            Join hundreds of SaaS companies using Recoverly to track and
            recover failed Stripe payments.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email alerts
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp alerts
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              SOC 2 ready
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-6 py-12">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-gray-900">Recoverly</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Recoverly. Built for SaaS companies.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900">Privacy</a>
            <a href="#" className="hover:text-gray-900">Terms</a>
            <a href="#" className="hover:text-gray-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
