import { Container, Title, Text, Button, Box } from "@mantine/core";
import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <Box className="relative w-full min-h-[55vh] flex items-center justify-center overflow-hidden bg-bg">
      <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-accent/20 blur-[80px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] rounded-full bg-accent/15 blur-[80px] animate-pulse-slow-delay" />
      <div className="absolute top-[20%] left-[40%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[60px] animate-pulse-slow-delay2" />
      <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] rounded-full bg-accent/15 blur-[60px] animate-pulse-slow" />

      <Container size="sm" className="relative z-10 text-center py-16 sm:py-0">
        <Title className="text-5xl md:text-7xl font-sans font-bold tracking-tighter leading-[1.1] text-text-primary">
          Soundscapes for <br />
          <span className="text-accent">places you can’t be.</span>
        </Title>

        <Text className="mt-6 text-lg md:text-xl text-text-secondary max-w-lg mx-auto leading-relaxed">
          Listen to forests, cities, and distant fields — layered, living, and
          endlessly looping.
        </Text>

        <Box className="mt-10">
          <Button
            size="xl"
            radius="xl"
            className="bg-accent hover:bg-accent/80 font-sans font-medium text-white px-10 transition-transform active:scale-95 shadow-lg shadow-accent/20"
          >
            <Link to="/explore">Enter a place</Link>
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
