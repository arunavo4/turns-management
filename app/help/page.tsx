"use client";

import { useState } from "react";
import {
  IconHelp,
  IconBook,
  IconMessageCircle,
  IconPhone,
  IconMail,
  IconSearch,
  IconChevronRight,
  IconExternalLink,
  IconQuestionMark,
  IconBulb,
  IconVideo,
  IconFileText,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/dashboard-layout";

const faqs = [
  {
    question: "How do I create a new turn?",
    answer: "To create a new turn, navigate to the Turns page and click the 'Create Turn' button. Fill in the required information including property, turn type, and estimated completion date.",
  },
  {
    question: "What's the difference between DFO and HO approval?",
    answer: "DFO (District Field Office) approval is required for turn expenses up to $5,000. HO (Head Office) approval is needed for amounts exceeding $5,000 or for special circumstances.",
  },
  {
    question: "How do I assign a vendor to a turn?",
    answer: "From the turn details page, click 'Assign Vendor' and select from the list of approved vendors. You can filter by specialty and availability.",
  },
  {
    question: "Can I export reports to Excel?",
    answer: "Yes, all reports can be exported. Navigate to the Reports page, generate your desired report, and click the 'Export' button to download in Excel format.",
  },
  {
    question: "How do I update vendor performance ratings?",
    answer: "Vendor ratings are automatically calculated based on completed turns. You can also manually add reviews from the vendor's profile page.",
  },
];

const resources = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of the Turns Management system",
    icon: IconBook,
    type: "Documentation",
  },
  {
    title: "Video Tutorials",
    description: "Step-by-step video guides for common tasks",
    icon: IconVideo,
    type: "Video",
  },
  {
    title: "API Documentation",
    description: "Technical documentation for developers",
    icon: IconFileText,
    type: "Technical",
  },
  {
    title: "Best Practices",
    description: "Tips and strategies for efficient turn management",
    icon: IconBulb,
    type: "Guide",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [supportTicket, setSupportTicket] = useState({
    subject: "",
    category: "",
    description: "",
  });

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitTicket = () => {
    console.log("Support ticket submitted:", supportTicket);
    setSupportTicket({ subject: "", category: "", description: "" });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground mt-2">
            Find answers, resources, and contact support
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for help articles, FAQs, or resources..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconQuestionMark className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {filteredFaqs.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No FAQs found matching your search.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Get in touch with our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <IconMessageCircle className="mr-2 h-4 w-4" />
                      Submit a Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Submit Support Ticket</DialogTitle>
                      <DialogDescription>
                        Describe your issue and we'll get back to you as soon as possible
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Brief description of your issue"
                          value={supportTicket.subject}
                          onChange={(e) =>
                            setSupportTicket({ ...supportTicket, subject: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={supportTicket.category}
                          onValueChange={(value) =>
                            setSupportTicket({ ...supportTicket, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bug">Bug Report</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="account">Account Issue</SelectItem>
                            <SelectItem value="technical">Technical Support</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Provide detailed information about your issue"
                          rows={5}
                          value={supportTicket.description}
                          onChange={(e) =>
                            setSupportTicket({ ...supportTicket, description: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button onClick={handleSubmitTicket}>Submit Ticket</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <IconPhone className="mr-2 h-4 w-4" />
                    Call: (555) 000-1234
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <IconMail className="mr-2 h-4 w-4" />
                    Email: support@turnsmanagement.com
                  </Button>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground">
                    Support Hours: Monday - Friday, 9AM - 5PM PST
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Average response time: 2-4 hours
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Services</span>
                  <Badge variant="default">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="default">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <Badge variant="default">Operational</Badge>
                </div>
                <div className="pt-2">
                  <Button variant="link" className="p-0 h-auto text-sm">
                    View Status Page
                    <IconExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Resources & Documentation</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <resource.icon className="h-8 w-8 text-primary" />
                    <Badge variant="secondary">{resource.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-medium mb-1">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                  <Button variant="link" className="p-0 h-auto mt-2 text-sm">
                    Learn more
                    <IconChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Popular Help Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {[
                "Managing Properties",
                "Turn Workflow Process",
                "Vendor Management",
                "Approval Workflows",
                "Report Generation",
                "User Permissions",
                "Data Export",
                "Email Notifications",
              ].map((topic) => (
                <Button
                  key={topic}
                  variant="ghost"
                  className="justify-start"
                >
                  <IconChevronRight className="mr-2 h-4 w-4" />
                  {topic}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}