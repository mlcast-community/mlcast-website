import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Database, Github, Terminal } from "lucide-react";

export const GetStarted = () => {
  return (
    <section className="py-24 px-4 bg-gradient-atmospheric">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Get Started</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Install the MLCast packages and start exploring datasets or training
            nowcasting models
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6 space-y-4 border-border/50">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-center">mlcast-datasets</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The source data intake catalog for curated nowcasting datasets. Use
              it to discover and open datasets for building machine learning
              training datasets.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm border border-border/50">
              <code className="text-foreground">pip install mlcast-datasets</code>
            </div>
            <Button variant="outline" className="w-full group" asChild>
              <a
                href="https://github.com/mlcast-community/mlcast-datasets/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                View mlcast-datasets
              </a>
            </Button>
          </Card>

          <Card className="p-6 space-y-4 border-border/50">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <Terminal className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-center">mlcast</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The machine learning nowcasting Python package. Use it to train
              and run AI-based weather nowcasting models through a command-line
              interface or Python API.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm border border-border/50">
              <code className="text-foreground">pip install mlcast</code>
            </div>
            <Button variant="outline" className="w-full group" asChild>
              <a
                href="https://github.com/mlcast-community/mlcast"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                View mlcast
              </a>
            </Button>
          </Card>
        </div>

        <Card className="p-8 border-primary/20 bg-card/50 backdrop-blur">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Developing mlcast locally</h3>
            <p className="text-sm text-muted-foreground">
              The mlcast package is under active development, so contributors
              should clone the repository and install it locally with uv.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm border border-border/50 overflow-x-auto">
              <code className="whitespace-pre text-foreground">{`git clone https://github.com/<your-github-username>/mlcast
cd mlcast
uv sync`}</code>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button variant="outline" size="lg" className="group" asChild>
                <a
                  href="https://github.com/mlcast-community/mlcast"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-5 w-5" />
                  View mlcast Repository
                </a>
              </Button>
              <Button variant="outline" size="lg" className="group" asChild>
                <a
                  href="https://github.com/mlcast-community/mlcast-datasets/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 h-5 w-5" />
                  View mlcast-datasets Repository
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
