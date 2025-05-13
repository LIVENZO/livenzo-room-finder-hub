
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Review, createReview, deleteReview, fetchRoomReviews, updateReview } from '@/services/ReviewService';
import { format } from 'date-fns';
import { Loader2, Star, StarIcon, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

interface RoomReviewsProps {
  roomId: string;
}

const RoomReviews: React.FC<RoomReviewsProps> = ({ roomId }) => {
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReview, setShowAddReview] = useState(false);
  const [showEditReview, setShowEditReview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  
  // Check if user has already reviewed
  const userReview = user ? reviews.find(review => review.user_id === user.id) : null;
  
  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      const roomReviews = await fetchRoomReviews(roomId);
      setReviews(roomReviews);
      setLoading(false);
    };
    
    loadReviews();
  }, [roomId]);
  
  const handleAddReview = async () => {
    if (!user) return;
    
    setSubmitting(true);
    
    const newReview = {
      user_id: user.id,
      room_id: roomId,
      rating,
      comment: comment || null
    };
    
    const result = await createReview(newReview);
    
    if (result) {
      setReviews([...reviews, result]);
      setShowAddReview(false);
      setComment('');
      setRating(5);
    }
    
    setSubmitting(false);
  };
  
  const handleUpdateReview = async () => {
    if (!user || !editingReview) return;
    
    setSubmitting(true);
    
    const result = await updateReview(editingReview.id, { rating, comment: comment || null });
    
    if (result) {
      setReviews(reviews.map(review => review.id === result.id ? result : review));
      setShowEditReview(false);
    }
    
    setSubmitting(false);
  };
  
  const handleDeleteReview = async () => {
    if (!deletingReviewId) return;
    
    const result = await deleteReview(deletingReviewId);
    
    if (result) {
      setReviews(reviews.filter(review => review.id !== deletingReviewId));
      setDeletingReviewId(null);
      setShowDeleteDialog(false);
    }
  };
  
  const openEditDialog = (review: Review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment || '');
    setShowEditReview(true);
  };
  
  const openDeleteDialog = (reviewId: string) => {
    setDeletingReviewId(reviewId);
    setShowDeleteDialog(true);
  };
  
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 'No ratings yet';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        {user && !userReview && (
          <Button onClick={() => setShowAddReview(true)}>Write a Review</Button>
        )}
      </div>
      
      {/* Reviews summary */}
      <div className="flex items-center gap-2 text-lg">
        <div className="flex items-center">
          <StarIcon className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <span className="ml-1 font-semibold">{averageRating}</span>
        </div>
        <span className="text-gray-500">•</span>
        <span className="text-gray-500">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
      </div>
      
      {/* Reviews list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-gray-500">
              No reviews yet. Be the first to review this room!
            </CardContent>
          </Card>
        ) : (
          reviews.map(review => {
            const isUserReview = user && review.user_id === user.id;
            
            return (
              <Card key={review.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(review as any).user_profiles?.avatar_url || ''} />
                        <AvatarFallback>
                          {(review as any).user_profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {(review as any).user_profiles?.full_name || 'Anonymous'}
                        </CardTitle>
                        <CardDescription>{format(new Date(review.created_at), 'PPP')}</CardDescription>
                      </div>
                    </div>
                    
                    {isUserReview && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(review)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(review.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  {review.comment && <p className="text-gray-700">{review.comment}</p>}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Add Review Dialog */}
      <Dialog open={showAddReview} onOpenChange={setShowAddReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with this room to help others make informed decisions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="font-medium">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">Your Review (optional)</p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details about your experience..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddReview(false)}>Cancel</Button>
            <Button onClick={handleAddReview} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Review Dialog */}
      <Dialog open={showEditReview} onOpenChange={setShowEditReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Your Review</DialogTitle>
            <DialogDescription>
              Update your rating and review for this room.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="font-medium">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">Your Review (optional)</p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details about your experience..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditReview(false)}>Cancel</Button>
            <Button onClick={handleUpdateReview} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Review Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReview}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoomReviews;
