import React from 'react';
import { Link } from '../routing';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '../components';
import { CheckSquare, BookOpen, FolderOpen, Sparkles, Lightbulb } from 'lucide-react';

/**
 * Shared HomePage component that works across desktop and web platforms
 * Uses universal routing abstractions for cross-platform compatibility
 */
export const HomePage: React.FC = () => {
  const features = [
    {
      title: 'ActionHub',
      description: 'Efficiently manage tasks, projects, and priorities with a customizable workflow.',
      icon: CheckSquare,
      route: '/actionhub',
    },
    {
      title: 'Journal',
      description: 'Capture thoughts, ideas, and reflections with a private, secure journaling system.',
      icon: BookOpen,
      route: '/journal',
    },
    {
      title: 'Projects',
      description: 'Organize related tasks into projects with visual progress tracking.',
      icon: FolderOpen,
      route: '/actionhub',
    },
    {
      title: 'AI Summaries',
      description: 'Generate AI-powered summaries of your tasks and journal entries by date range.',
      icon: Sparkles,
      route: '/summary',
    },
    {
      title: 'Insights Hub',
      description: 'AI-powered insights, analytics, and personalized recommendations.',
      icon: Lightbulb,
      route: '/insights',
    },
  ];

  return (
    <div className="flex-1 h-full bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.09),transparent_55%)] opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.04),transparent_60%)]" />
      <div className="relative flex-1 overflow-auto">
        <div className="px-6 pb-16 pt-12 md:px-10">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse" />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary flex items-center justify-center text-3xl md:text-4xl font-bold text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.3)]">
                    S
                  </div>
                </div>
                <div className="space-y-4 max-w-2xl mx-auto">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Serenity Notes
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground">
                    Boost your productivity and mindfulness with a powerful integrated task management and journaling experience.
                  </p>
                </div>
              </div>
            </div>

            <section className="space-y-10">
              <div className="grid gap-6 md:grid-cols-2">
                {features.map(feature => {
                  const Icon = feature.icon;
                  return (
                    <Link key={feature.title} href={feature.route}>
                      <Card className="group relative overflow-hidden border border-border/60 bg-card/80 backdrop-blur transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                        <CardHeader className="relative z-10 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors duration-300 group-hover:bg-primary/10">
                              <Icon className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-2xl">{feature.title}</CardTitle>
                          </div>
                          <CardDescription className="text-base leading-relaxed text-muted-foreground">
                            {feature.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <Card className="relative overflow-hidden border border-border/60 bg-card/80 backdrop-blur">
                  <CardContent className="relative z-10 flex flex-col items-center gap-6 py-10 px-10 text-center">
                    <h2 className="text-2xl font-semibold text-foreground">
                      Ready to get started?
                    </h2>
                    <p className="max-w-xl text-muted-foreground">
                      Choose your workflow and begin your journey to enhanced productivity.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                      <Link href="/actionhub">
                        <Button>Start with Tasks</Button>
                      </Link>
                      <Link href="/journal">
                        <Button variant="secondary">Begin Journaling</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
