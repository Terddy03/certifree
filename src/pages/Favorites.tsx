import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Users, Clock, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { isFavorited, removeFavorite } from "@/lib/favorites";
import { isTaking, startTaking, stopTaking } from "@/lib/progress";

export default function Favorites() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("certification_id, certifications:certification_id(id, title, provider, description, duration, external_url)");
      if (error) toast({ title: "Failed to load favorites", description: error.message, variant: "destructive" });
      else setRows(data || []);
    })();
  }, [profile?.id]);

  const toggleFavorite = async (certId: string) => {
    if (!profile?.id) return;
    const { error } = await removeFavorite(profile.id, certId);
    if (error) toast({ title: "Could not remove", description: error.message, variant: "destructive" });
    else setRows(prev => prev.filter(r => r.certification_id !== certId));
  };

  const toggleTaking = async (certId: string) => {
    if (!profile?.id) return;
    const { data } = await isTaking(profile.id, certId);
    const { error } = data ? await stopTaking(profile.id, certId) : await startTaking(profile.id, certId);
    if (error) toast({ title: "Could not update", description: error.message, variant: "destructive" });
    else toast({ title: data ? "Stopped" : "Started", description: data ? "No longer taking" : "Tracking started" });
  };

  return (
    <div className="min-h-screen bg-[#000814] text-gray-100">
      <Header />
      <main className="container mx-auto px-6 py-12 md:py-16">
        <h1 className="text-3xl font-extrabold text-white mb-6">Favorite Certifications</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((r) => (
            <Card key={r.certification_id} className="bg-[#001d3d] border-[#003566]">
              <CardHeader>
                <CardTitle className="text-white text-base">{r.certifications.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 text-xs text-gray-300">
                  <div className="w-16 h-6 rounded bg-[#003566] flex items-center justify-center text-[10px] text-gray-200 flex-shrink-0">{r.certifications.provider}</div>
                  <p className="text-gray-400 line-clamp-2">{r.certifications.description}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{r.certifications.duration}</span>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-[#003566] text-gray-300" onClick={() => toggleTaking(r.certification_id)}>I am taking this cert</Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => toggleFavorite(r.certification_id)}><Heart className="h-5 w-5 fill-red-500" /></Button>
                  <Button variant="outline" size="icon" asChild className="bg-[#003566] text-[#ffd60a] border-[#001d3d] hover:bg-[#001d3d]">
                    <a href={r.certifications.external_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-5 w-5" /></a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {rows.length === 0 && (
          <p className="text-gray-400">No favorites yet.</p>
        )}
      </main>
      <Footer />
    </div>
  );
} 