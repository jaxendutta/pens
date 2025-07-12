'use client';

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Chip
} from "@heroui/react";
import NextLink from 'next/link';
import { GithubIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-4xl">
          <Chip color="primary" variant="flat" className="mb-4">
            <GithubIcon size={20} className="inline-block mr-2" />
            <NextLink href={siteConfig.links.github}>jaxendutta/pens</NextLink>
          </Chip>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Jaxen's <span className="text-primary">Pens</span>
          </h1>

          <p className="text-xl text-default-600 mb-8 max-w-2xl">
            A curated collection of stories and poems I ended up writing
            throughout my life, capturing the essence of my thoughts and
            experiences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              as={NextLink}
              href="/pieces"
              color="primary"
              size="lg"
              className="font-medium"
            >
              Explore Stories
            </Button>
            <Button
              as={NextLink}
              href="/poems"
              variant="bordered"
              size="lg"
              className="font-medium"
            >
              Read Poems
            </Button>
          </div>
        </div>
      </section>

      {/* Collections Preview */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Choose Your Journey
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Stories Card */}
            <Card className="p-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <Chip color="primary" variant="flat" className="mb-2">Stories</Chip>
                <h3 className="font-bold text-large">Literary Pieces</h3>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p className="text-default-600">
                  Immersive narratives that explore the depths of human experience
                  through carefully crafted prose and compelling characters.
                </p>
              </CardBody>
              <CardFooter>
                <Button
                  as={NextLink}
                  href="/pieces"
                  color="primary"
                  variant="flat"
                  fullWidth
                >
                  Browse Stories
                </Button>
              </CardFooter>
            </Card>

            {/* Poems Card */}
            <Card className="p-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <Chip color="secondary" variant="flat" className="mb-2">Poetry</Chip>
                <h3 className="font-bold text-large">Poem Collection</h3>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p className="text-default-600">
                  Lyrical expressions capturing moments, emotions, and reflections
                  in crystalline verse that resonates with the soul.
                </p>
              </CardBody>
              <CardFooter>
                <Button
                  as={NextLink}
                  href="/poems"
                  color="secondary"
                  variant="flat"
                  fullWidth
                >
                  Discover Poems
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}