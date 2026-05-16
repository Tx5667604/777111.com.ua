'use client'

import { motion } from 'framer-motion'
import { Calendar, ArrowRight, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { blogPosts as blogData } from '@/app/data'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string | null
  imageUrl: string | null
  author: string
  createdAt: string
}

const blogGradients = [
  'from-orange-400 to-amber-500',
  'from-amber-500 to-yellow-500',
  'from-rose-400 to-orange-400',
]

const blogIcons = ['🔋', '🔧', '⚠️']

export default function Blog() {
  const posts = blogData

  if (posts.length === 0) return null

  return (
    <section id="blog" className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Блог
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
            Корисні статті
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Поради та рекомендації з догляду за вашими пристроями
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full group hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Image placeholder */}
                <div
                  className={`h-48 bg-gradient-to-br ${
                    blogGradients[index % blogGradients.length]
                  } flex items-center justify-center`}
                >
                  <div className="text-center text-white">
                    <span className="text-5xl block mb-2">{blogIcons[index % blogIcons.length]}</span>
                    <BookOpen className="w-6 h-6 mx-auto opacity-60" />
                  </div>
                </div>

                <CardContent className="p-5">
                  <Badge variant="secondary" className="mb-3 text-xs">
                    Стаття
                  </Badge>

                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.createdAt).toLocaleDateString('uk-UA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <button className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
                      Читати далі
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
