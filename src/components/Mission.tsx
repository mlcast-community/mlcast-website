export const Mission = () => {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Our Mission
          </h2>
          
          <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed space-y-4">
            <p>
              We are an <span className="text-foreground font-semibold">open-source community</span> dedicated 
              to advancing machine learning for weather nowcasting through collaborative development and shared resources.
            </p>
            
            <p>
              Our collective gives institutes with GPU access the opportunity to train models, while those with 
              limited resources can contribute to development, testing, and ultimately benefit from using these models.
            </p>
            
            <p>
              Through equal ownership and transparent collaboration, we're creating a unified Python package that 
              makes state-of-the-art nowcasting accessible to everyone.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
