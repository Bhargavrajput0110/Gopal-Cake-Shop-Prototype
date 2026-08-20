"use client";

import { useState, useEffect } from "react";
import { Star1, TickSquare, CloseSquare, ShieldCross, ArrowLeft, Refresh2 } from "iconsax-react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  status: string; // PENDING, APPROVED, HIDDEN
  photos: string[];
  createdAt: string;
  reviewerName: string;
  productName: string;
};

export default function ReviewModeration() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load reviews from API
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/reviews");
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          setReviews([]);
        } else {
          setReviews(data);
          setError(null);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to fetch reviews");
        setReviews([]);
      }
    } catch (e: any) {
      console.error("Failed to load reviews:", e);
      setError(e.message || "Failed to connect to reviews API");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerate = async (reviewId: string, status: 'APPROVED' | 'HIDDEN') => {
    // Optimistic UI update
    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, status } : r))
    );

    try {
      const res = await fetch("/api/v1/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn("Moderate API error:", errData.error || `Status ${res.status}`);
        // Revert on error
        fetchReviews();
      }
    } catch (e) {
      console.error("Network error during moderation", e);
      fetchReviews();
    }
  };



  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C5A059]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <BackButton fallback="/admin" label="Back to Dashboard" variant="link" className="px-0 w-fit text-muted-foreground hover:text-primary transition-colors mb-2" />
            <h1 className="text-4xl font-black text-foreground tracking-tight">Review Moderation</h1>
            <p className="text-muted-foreground font-medium mt-1">Approve or hide customer reviews before they display publicly.</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <ShieldCross className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-800">Error Loading Reviews</p>
              <p className="text-xs text-rose-700 mt-0.5">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Reviews Table Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 border-b border-border/50">
                  <th className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Customer & Date</th>
                  <th className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Product Name</th>
                  <th className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Rating</th>
                  <th className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Comment</th>
                  <th className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <Refresh2 className="w-5 h-5 animate-spin text-primary" />
                        <span>Loading reviews...</span>
                      </div>
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground font-medium">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-foreground">{review.reviewerName}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-secondary rounded-lg text-xs font-bold text-muted-foreground">
                          {review.productName}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star1
                              key={idx}
                              className={`w-4.5 h-4.5 ${
                                idx < review.rating ? "fill-[#C5A059] text-[#C5A059]" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 max-w-xs md:max-w-md">
                        <p className="text-xs text-foreground font-medium leading-relaxed italic">{review.comment ? `"${review.comment}"` : "No comment left"}</p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            review.status === 'APPROVED'
                              ? "bg-emerald-100 text-emerald-700"
                              : review.status === 'HIDDEN'
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {review.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleModerate(review.id, 'APPROVED')}
                            className={`p-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${
                              review.status === 'APPROVED'
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            }`}
                            disabled={review.status === 'APPROVED'}
                            title="Approve Review"
                          >
                            <TickSquare className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => handleModerate(review.id, 'HIDDEN')}
                            className={`p-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${
                              review.status === 'HIDDEN'
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                            }`}
                            disabled={review.status === 'HIDDEN'}
                            title="Hide Review"
                          >
                            <CloseSquare className="w-4 h-4" /> Hide
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
