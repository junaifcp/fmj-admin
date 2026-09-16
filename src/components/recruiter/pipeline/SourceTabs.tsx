import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, XCircle, ExternalLink, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Pipeline } from "@/types/pipeline";

interface SourceTabsProps {
  pipeline: Pipeline;
}

export const SourceTabs: React.FC<SourceTabsProps> = ({ pipeline }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = () => {
    if (pipeline.publicLink?.url) {
      navigator.clipboard.writeText(pipeline.publicLink.url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Public application link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Tabs defaultValue="database" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="database">Database</TabsTrigger>
        <TabsTrigger value="public-link">Public Link</TabsTrigger>
        <TabsTrigger value="blogs">Blogs</TabsTrigger>
      </TabsList>

      <AnimatePresence mode="wait">
        <TabsContent value="database" className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Database Source</CardTitle>
                    <CardDescription>
                      Applications from registered candidates in your database
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      pipeline.sources.database ? "default" : "secondary"
                    }
                  >
                    {pipeline.sources.database ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Candidates who are registered in the system can apply directly
                  through the job listing page.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="public-link" className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Public Application Link</CardTitle>
                    <CardDescription>
                      Share this link to allow anyone to apply
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      pipeline.publicLink?.isActive ? "default" : "secondary"
                    }
                  >
                    {pipeline.publicLink?.isActive ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pipeline.publicLink ? (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <code className="flex-1 text-sm break-all">
                        {pipeline.publicLink.url}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyLink}
                        className="shrink-0"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(pipeline.publicLink?.url, "_blank")
                        }
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Link
                      </Button>
                    </div>
                    {pipeline.publicLink.maxApplications && (
                      <p className="text-xs text-muted-foreground">
                        Max applications: {pipeline.publicLink.maxApplications}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No public link configured for this pipeline.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="blogs" className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Blog Posts</CardTitle>
                    <CardDescription>
                      Applications from blog post links
                    </CardDescription>
                  </div>
                  <Badge
                    variant={pipeline.sources.blogs ? "default" : "secondary"}
                  >
                    {pipeline.sources.blogs ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pipeline.blogs && pipeline.blogs.length > 0 ? (
                  <div className="space-y-3">
                    {pipeline.blogs.map((blog) => (
                      <Card
                        key={blog.blogId}
                        className="border-l-4 border-l-primary"
                      >
                        <CardContent className="pt-4">
                          <h4 className="font-semibold mb-1">{blog.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {blog.url}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(blog.url, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Blog
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(blog.applyLink, "_blank")
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Apply Link
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No blog posts configured for this pipeline.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </AnimatePresence>
    </Tabs>
  );
};
