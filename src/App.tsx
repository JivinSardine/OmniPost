/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Linkedin, 
  Twitter, 
  Instagram, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  Download, 
  Copy, 
  Check,
  Send,
  Heart,
  MessageCircle,
  Bookmark,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Share2,
  MoreHorizontal,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';
import { Tone, GeneratedPost } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TONES: { value: Tone; label: string; icon: string }[] = [
  { value: 'professional', label: 'Professional', icon: '💼' },
  { value: 'witty', label: 'Witty', icon: '💡' },
  { value: 'urgent', label: 'Urgent', icon: '🚨' },
];

const toneConfig = {
  professional: {
    active: "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-blue-600",
    inactive: "text-blue-500 hover:text-blue-700 hover:bg-blue-50/50",
    button: "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-[0_8px_16px_rgba(37,99,235,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-blue-600",
  },
  witty: {
    active: "bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-purple-600",
    inactive: "text-purple-500 hover:text-purple-700 hover:bg-purple-50/50",
    button: "bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-[0_8px_16px_rgba(168,85,247,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-purple-600",
  },
  urgent: {
    active: "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-[0_4px_12px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-orange-600",
    inactive: "text-orange-500 hover:text-orange-700 hover:bg-orange-50/50",
    button: "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-[0_8px_16px_rgba(249,115,22,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-orange-600",
  }
};

export default function App() {
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState<Tone>('professional');
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [logo, setLogo] = useState<string | null>(null);
  const [resourceLinks, setResourceLinks] = useState<string[]>([]);
  const [resourceInput, setResourceInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [posts, setPosts] = useState<GeneratedPost[] | null>(null);
  const [analysisNote, setAnalysisNote] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<{url: string, platform: string} | null>(null);

  const handleResourceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = resourceInput.trim();
      if (val) {
        setResourceLinks([...resourceLinks, val]);
        setResourceInput('');
      }
    }
  };

  const removeResourceLink = (index: number) => {
    setResourceLinks(resourceLinks.filter((_, i) => i !== index));
  };

  const getDomain = (urlStr: string) => {
    try {
      const withProtocol = urlStr.startsWith('http') ? urlStr : `https://${urlStr}`;
      const url = new URL(withProtocol);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return urlStr;
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogo(result);

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          
          const MAX_SIZE = 100;
          let width = img.width;
          let height = img.height;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          try {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            const colorCounts: Record<string, number> = {};
            let maxCount = 0;
            let domColor: { r: number, g: number, b: number } | null = null;
            
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];
              
              if (a < 128) continue; // Skip mostly transparent
              if (r > 240 && g > 240 && b > 240) continue; // Skip almost white
              if (r < 15 && g < 15 && b < 15) continue; // Skip almost black
              
              const qR = Math.round(r / 20) * 20;
              const qG = Math.round(g / 20) * 20;
              const qB = Math.round(b / 20) * 20;
              const key = `${qR},${qG},${qB}`;
              
              colorCounts[key] = (colorCounts[key] || 0) + 1;
              if (colorCounts[key] > maxCount) {
                maxCount = colorCounts[key];
                domColor = { r, g, b };
              }
            }
            
            if (domColor) {
              const toHex = (c: number) => c.toString(16).padStart(2, '0');
              setBrandColor(`#${toHex(domColor.r)}${toHex(domColor.g)}${toHex(domColor.b)}`);
            }
          } catch (err) {
            console.error("Could not extract color", err);
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePosts = async () => {
    if (!idea.trim()) return;

    setIsGenerating(true);
    setPosts(null);
    setAnalysisNote(null);

    try {
      // 1. Generate text drafts and image prompts with Google Search grounding
      const textResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Research current trends, news, and best practices related to this idea: "${idea}". 
        Then, generate social media posts for LinkedIn (engaging long-form), Twitter/X (punchy and short), and Instagram (visually descriptive with hashtags).
        
        The tone should be ${tone}.
        The brand color is ${brandColor}.
        ${logo ? "A brand logo will be provided for the visual style." : ""}
        ${resourceLinks.length > 0 ? `Review and analyze these resource links: "${resourceLinks.join(', ')}". Analyze how they have previously generated and posted messages, how the images look, and their overall style. Use this analysis to shape the generated posts so they align with the brand's established presence. Furthermore, provide a helpful note ('helpfulNote') summarizing this analysis and explaining how it was applied to the posts.` : ""}
        
        Leverage facts, statistics, or recent developments found via search to make the posts more authoritative and timely.
        
        For each platform, also provide a highly descriptive, artistic image prompt that would work well for an AI image generator to accompany these posts.
        LinkedIn: Professional, high-quality office/abstract/landscape incorporating ${brandColor} as a primary accent.
        Twitter: Sharp, high-contrast, conceptual using ${brandColor} palette.
        Instagram: Aesthetic, vibrant, trend-focused incorporating ${brandColor}.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              helpfulNote: { type: Type.STRING },
              linkedin: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["text", "imagePrompt"]
              },
              twitter: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["text", "imagePrompt"]
              },
              instagram: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["text", "imagePrompt"]
              }
            },
            required: ["linkedin", "twitter", "instagram"]
          }
        }
      });

      const content = JSON.parse(textResponse.text || '{}');
      if (content.helpfulNote) {
        setAnalysisNote(content.helpfulNote);
      }
      
      // 2. Generate images in parallel
      const platforms: ('linkedin' | 'twitter' | 'instagram')[] = ['linkedin', 'twitter', 'instagram'];
      const imageRatios = {
        linkedin: '16:9' as const,
        twitter: '16:9' as const,
        instagram: '1:1' as const
      };

      const imagePromises = platforms.map(async (platform) => {
        try {
          const parts: any[] = [{ text: `A ${platform} header image: ${content[platform].imagePrompt}, high resolution, professional style, photorealistic. Primary brand color: ${brandColor}.` }];
          
          if (logo) {
            parts.push({
              inlineData: {
                data: logo.split(',')[1],
                mimeType: "image/png"
              }
            });
            parts[0].text += " Incorporate the provided branding logo subtly and professionally into the composition.";
          }

          const imgResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: imageRatios[platform],
              },
            },
          });

          let imageUrl = null;
          for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
          return { platform, text: content[platform].text, imageUrl };
        } catch (error) {
          console.error(`Image generation for ${platform} failed:`, error);
          return { platform, text: content[platform].text, imageUrl: `https://picsum.photos/seed/${platform}-${Date.now()}/800/600` };
        }
      });

      const finalPosts = await Promise.all(imagePromises);
      setPosts(finalPosts as GeneratedPost[]);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const exportToJSON = () => {
    if (!posts) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(posts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "omnipost_drafts.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportToCSV = () => {
    if (!posts) return;
    
    const headers = ['Platform', 'Text', 'Image URL'];
    const rows = posts.map(post => {
      const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        escapeCsv(post.platform),
        escapeCsv(post.text),
        escapeCsv(post.imageUrl || '')
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(','), ...rows].join("\n"));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     csvContent);
    downloadAnchorNode.setAttribute("download", "omnipost_drafts.csv");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Navigation */}
      <header className="sticky top-0 z-50 glass border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#111] rounded-xl flex items-center justify-center shadow-lg shadow-black/10 rotate-[-4deg]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-bold text-xl tracking-tighter">OmniPost</span>
              <span className="text-[10px] font-mono font-medium text-blue-600 uppercase tracking-widest">Enterprise AI</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <span className="hover:text-black cursor-pointer transition-colors">Documentation</span>
              <span className="hover:text-black cursor-pointer transition-colors">API Keys</span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">v1.2.4-STABLE</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {/* Input Section */}
        <section className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-10"
          >
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-md text-gray-800 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border border-gray-200/50 shadow-sm hover-shadow cursor-default transition-all duration-500">
                <Sparkles className="w-3 h-3" />
                Cross-Platform Intelligence
              </div>
              <h1 className="text-5xl tracking-tight text-gray-900 md:text-6xl lg:text-7xl font-serif">
                One idea. <br className="hidden sm:block" />
                <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 animate-text-flow">Infinite reach.</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-gray-500 leading-relaxed font-light">
                OmniPost synchronizes your brand message across platforms using Grounded Research and AI visualization.
              </p>
            </div>

            <div className="bg-white/30 backdrop-blur-3xl p-2.5 rounded-[32px] border border-white/80 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1),inset_0_1px_rgba(255,255,255,1)] hover-shadow transition-all duration-500">
              <div className="relative">
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Paste your content seed here..."
                  className="w-full h-40 p-8 rounded-[24px] bg-white/70 border-none focus:bg-white focus:ring-0 transition-all resize-none text-xl leading-relaxed placeholder:text-gray-400 font-medium"
                />
                <div className="absolute bottom-6 right-6 flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-gray-500 bg-white/50 px-2 py-1 rounded backdrop-blur-sm border border-white/60">
                    <span>Shift + Enter to send</span>
                  </div>
                  <button
                    onClick={generatePosts}
                    disabled={isGenerating || !idea.trim()}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100 transition-all font-bold tracking-tight group",
                      idea.trim() ? toneConfig[tone].button : "bg-[#111] text-white shadow-xl"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Synchronizing...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Multi-Post</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 pt-4 flex flex-col sm:flex-row flex-wrap gap-8 items-start sm:items-center border-t border-white/60 mt-2">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#111]">Tactical Tone</span>
                  <div className="flex p-1.5 bg-white/50 backdrop-blur-md rounded-xl border border-white shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]">
                    {TONES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTone(t.value)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 uppercase tracking-tighter border border-transparent",
                          tone === t.value 
                            ? toneConfig[t.value].active 
                            : toneConfig[t.value].inactive
                        )}
                      >
                        <span className="text-base">{t.icon}</span>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-grow w-full sm:w-auto">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Add Resources (Optional)</span>
                  {resourceLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
                      {resourceLinks.map((link, idx) => (
                        <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">
                          {getDomain(link)}
                          <button onClick={() => removeResourceLink(idx)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={resourceInput}
                    onChange={(e) => setResourceInput(e.target.value)}
                    onKeyDown={handleResourceKeyDown}
                    placeholder="Website, LinkedIn, or IG links... (Press Enter)"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

              {/* Brand Kit Section */}
              <div className="pt-8 space-y-6 border-t border-gray-100 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Section 02</span>
                    <h2 className="text-sm font-bold text-gray-900">Brand Parameters</h2>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Logo Upload - Enhanced */}
                  <div className="group relative glass p-5 rounded-2xl technical-border hover-shadow transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-black/20 transition-colors">
                        {logo ? (
                          <img src={logo} alt="Brand Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <Sparkles className="w-6 h-6 text-gray-300 group-hover:text-black/20 transition-colors" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visual Asset</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">Corporate Identity</p>
                        <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 cursor-pointer mt-1 bg-blue-50 px-2 py-0.5 rounded-full transition-colors">
                          {logo ? "Replace Asset" : "Upload PNG"}
                          <input type="file" className="hidden" accept="image/png" onChange={handleLogoUpload} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Color Picker - Technical Redesign (Focused Element) */}
                  <div className="glass p-5 rounded-2xl technical-border hover-shadow transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="relative group/color">
                        <div 
                          className="w-14 h-14 rounded-xl shrink-0 border border-black/5 shadow-inner transition-transform group-hover/color:scale-105"
                          style={{ backgroundColor: brandColor }}
                        />
                        <input 
                          type="color" 
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </div>
                      <div className="flex-grow">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Color Standard</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-sm font-bold text-gray-900">Accent Tone</p>
                          <code className="text-[11px] font-mono font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            {brandColor.toUpperCase()}
                          </code>
                        </div>
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full"
                            style={{ backgroundColor: brandColor, width: '100%' }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

        {/* Results Section */}
        <section className="mt-20">
          <AnimatePresence mode="wait">
            {posts ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {analysisNote && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-50/50 border border-blue-100 p-6 rounded-[24px] shadow-sm mb-8"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-2 font-mono">Strategic Analysis & Alignment</h3>
                        <div className="text-sm text-blue-800/80 leading-relaxed max-w-5xl">
                          <ReactMarkdown>{analysisNote}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl tracking-tight text-gray-900 font-serif">Omni-Channel Echoes</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={exportToCSV} className="text-xs font-bold uppercase tracking-wider px-4 py-2 bg-white rounded-xl border border-gray-100 hover-shadow shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all text-gray-600 hover:text-black">
                      Export CSV
                    </button>
                    <button onClick={exportToJSON} className="text-xs font-bold uppercase tracking-wider px-4 py-2 bg-[#111] text-white rounded-xl hover-shadow shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all">
                      Export JSON
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {posts.map((post, i) => (
                  <motion.article
                    key={post.platform}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group bg-white rounded-3xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col hover-shadow transition-all duration-500"
                  >
                    {/* Platform Header */}
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          post.platform === 'linkedin' && "bg-[#0077b5]/10 text-[#0077b5] group-hover:bg-[#0077b5] group-hover:text-white",
                          post.platform === 'twitter' && "bg-black/10 text-black group-hover:bg-black group-hover:text-white",
                          post.platform === 'instagram' && "bg-[#E4405F]/10 text-[#E4405F] group-hover:bg-[#E4405F] group-hover:text-white"
                        )}>
                          {post.platform === 'linkedin' && <Linkedin className="w-5 h-5 fill-current" />}
                          {post.platform === 'twitter' && <Twitter className="w-5 h-5 fill-current" />}
                          {post.platform === 'instagram' && <Instagram className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col -space-y-1">
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Channel</span>
                          <span className="font-bold capitalize">{post.platform}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => copyToClipboard(post.text, i)}
                          className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all relative group/btn"
                        >
                          {copiedIndex === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400 group-hover/btn:text-black" />}
                        </button>
                        <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl transition-all group/btn">
                          <Download className="w-4 h-4 text-gray-400 group-hover/btn:text-black" />
                        </button>
                      </div>
                    </div>

                    {/* Simulator Content */}
                    <div className="p-4 md:p-6 bg-gray-50 flex justify-center flex-grow">
                      {post.platform === 'linkedin' && (
                        <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 shadow-sm overflow-hidden text-left flex flex-col self-start hover:-translate-y-1 transition-transform duration-300">
                          <div className="p-4 flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex-shrink-0 flex items-center justify-center">
                              <Linkedin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-gray-900 flex items-center justify-between">
                                <span className="truncate">OmniPost Strategist</span>
                                <MoreHorizontal className="w-5 h-5 text-gray-500" />
                              </div>
                              <div className="text-xs text-gray-600 truncate">Brand Identity & Marketing</div>
                              <div className="text-[11px] text-gray-500">1h • 🌎</div>
                            </div>
                          </div>
                          <div className="px-4 pb-3 text-sm text-gray-800 leading-relaxed font-normal">
                            <div className="prose-sm"><ReactMarkdown>{post.text}</ReactMarkdown></div>
                          </div>
                          {post.imageUrl ? (
                            <img 
                              src={post.imageUrl} 
                              className="w-full object-cover cursor-zoom-in hover:opacity-95 transition-opacity" 
                              alt="LinkedIn content" 
                              referrerPolicy="no-referrer" 
                              onClick={() => setSelectedImage({ url: post.imageUrl, platform: post.platform })}
                            />
                          ) : (
                            <div className="w-full aspect-[16/9] bg-gray-100 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                            </div>
                          )}
                          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-gray-500">
                            <button className="flex items-center gap-1.5 text-xs font-semibold hover:text-blue-600 transition-colors"><ThumbsUp className="w-4 h-4" /> <span className="hidden sm:inline">Like</span></button>
                            <button className="flex items-center gap-1.5 text-xs font-semibold hover:text-blue-600 transition-colors"><MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Comment</span></button>
                            <button className="flex items-center gap-1.5 text-xs font-semibold hover:text-blue-600 transition-colors"><Repeat2 className="w-4 h-4" /> <span className="hidden sm:inline">Repost</span></button>
                            <button className="flex items-center gap-1.5 text-xs font-semibold hover:text-blue-600 transition-colors"><Send className="w-4 h-4" /> <span className="hidden sm:inline">Send</span></button>
                          </div>
                        </div>
                      )}

                      {post.platform === 'twitter' && (
                        <div className="bg-white w-full max-w-sm rounded-xl border border-gray-200 shadow-sm p-4 text-left flex flex-col self-start hover:-translate-y-1 transition-transform duration-300">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 bg-gray-900 rounded-full flex-shrink-0 flex items-center justify-center text-white">
                              <Twitter className="w-5 h-5 fill-current" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-[15px] font-bold text-gray-900">OmniPost</span>
                                  <span className="text-[15px] text-gray-500">@omnistrategy · 5m</span>
                                </div>
                                <MoreHorizontal className="w-5 h-5 text-gray-400" />
                              </div>
                              <div className="mt-1 text-[15px] text-gray-900 leading-normal mb-3">
                                <div className="prose-sm"><ReactMarkdown>{post.text}</ReactMarkdown></div>
                              </div>
                              {post.imageUrl ? (
                                <img 
                                  src={post.imageUrl} 
                                  className="w-full rounded-2xl object-cover border border-gray-100 cursor-zoom-in hover:opacity-95 transition-opacity" 
                                  alt="Twitter media" 
                                  referrerPolicy="no-referrer" 
                                  onClick={() => setSelectedImage({ url: post.imageUrl, platform: post.platform })}
                                />
                              ) : (
                                <div className="w-full aspect-[16/9] rounded-2xl bg-gray-100 border border-gray-100 flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                                </div>
                              )}
                              <div className="mt-4 flex items-center justify-between text-gray-500 pr-2">
                                <button className="flex items-center gap-1.5 text-xs hover:text-blue-500 transition-colors group/tw"><MessageCircle className="w-[18px] h-[18px] group-hover/tw:bg-blue-50 p-0.5 rounded-full" /> 12</button>
                                <button className="flex items-center gap-1.5 text-xs hover:text-green-500 transition-colors group/tw"><Repeat2 className="w-[18px] h-[18px] group-hover/tw:bg-green-50 p-0.5 rounded-full" /> 48</button>
                                <button className="flex items-center gap-1.5 text-xs hover:text-pink-500 transition-colors group/tw"><Heart className="w-[18px] h-[18px] group-hover/tw:bg-pink-50 p-0.5 rounded-full" /> 156</button>
                                <button className="flex items-center gap-1.5 text-xs hover:text-blue-500 transition-colors group/tw"><Share2 className="w-[18px] h-[18px] group-hover/tw:bg-blue-50 p-0.5 rounded-full" /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {post.platform === 'instagram' && (
                        <div className="bg-white w-full max-w-sm rounded-[24px] border border-gray-200 shadow-sm overflow-hidden text-left flex flex-col self-start hover:-translate-y-1 transition-transform duration-300">
                          <div className="p-3 pl-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 rounded-full p-[2px]">
                                <div className="w-full h-full bg-white rounded-full border border-white flex items-center justify-center">
                                   <Instagram className="w-4 h-4 text-gray-800" />
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-gray-900">omni_post</span>
                            </div>
                            <MoreHorizontal className="w-5 h-5 text-gray-900" />
                          </div>
                          {post.imageUrl ? (
                            <img 
                              src={post.imageUrl} 
                              className="w-full aspect-square object-cover cursor-zoom-in hover:opacity-95 transition-opacity" 
                              alt="Instagram content" 
                              referrerPolicy="no-referrer" 
                              onClick={() => setSelectedImage({ url: post.imageUrl, platform: post.platform })}
                            />
                          ) : (
                            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-4">
                                <Heart className="w-6 h-6 text-gray-900 hover:text-gray-600 cursor-pointer transition-colors" />
                                <MessageCircle className="w-6 h-6 text-gray-900 hover:text-gray-600 cursor-pointer transition-colors" />
                                <Send className="w-6 h-6 text-gray-900 hover:text-gray-600 cursor-pointer transition-colors" />
                              </div>
                              <Bookmark className="w-6 h-6 text-gray-900 hover:text-gray-600 cursor-pointer transition-colors" />
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mb-2">943 likes</div>
                            <div className="text-sm text-gray-900 leading-snug">
                              <span className="font-semibold mr-2">omni_post</span>
                              <span className="inline-block prose-sm inline"><ReactMarkdown>{post.text}</ReactMarkdown></span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">2 hours ago</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.article>
                ))}
                </div>
              </motion.div>
            ) : isGenerating ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-[600px] bg-white rounded-3xl border border-gray-100 animate-pulse flex flex-col">
                    <div className="h-16 border-b border-gray-50 m-4 bg-gray-50 rounded-xl" />
                    <div className="aspect-[16/9] bg-gray-50 m-4 rounded-2xl" />
                    <div className="flex-grow m-8 space-y-4">
                      <div className="h-4 bg-gray-50 rounded w-full" />
                      <div className="h-4 bg-gray-50 rounded w-5/6" />
                      <div className="h-4 bg-gray-50 rounded w-4/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 border-2 border-dashed border-gray-200 rounded-[40px]">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Send className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Deep strategy starts with an idea</h3>
                <p className="text-gray-500 mt-2">Enter your prompt above to generate your social ecosystem.</p>
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-50 rounded-full blur-[120px] opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-50 rounded-full blur-[120px] opacity-70" />
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-12 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-7xl max-h-full flex items-center justify-center bg-transparent rounded-lg shadow-2xl"
            >
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 md:-top-4 md:-right-12 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-10 hidden md:flex"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md flex items-center gap-2 z-10">
                {selectedImage.platform === 'linkedin' && <Linkedin className="w-4 h-4 text-blue-400" />}
                {selectedImage.platform === 'twitter' && <Twitter className="w-4 h-4 text-sky-400" />}
                {selectedImage.platform === 'instagram' && <Instagram className="w-4 h-4 text-pink-400" />}
                {selectedImage.platform}
              </div>

              <img 
                src={selectedImage.url} 
                alt={`${selectedImage.platform} enlarged preview`} 
                className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
