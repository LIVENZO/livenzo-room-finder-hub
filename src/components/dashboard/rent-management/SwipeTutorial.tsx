import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Hand, CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeTutorialProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const SwipeTutorial: React.FC<SwipeTutorialProps> = ({
  isVisible,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    {
      title: "Swipe Left to Mark Unpaid",
      description: "Swipe left on any renter card to mark them as unpaid",
      direction: "left",
      color: "red",
      icon: XCircle
    },
    {
      title: "Swipe Right to Mark Paid", 
      description: "Swipe right on any renter card to mark them as paid",
      direction: "right",
      color: "green", 
      icon: CheckCircle
    }
  ];

  useEffect(() => {
    if (isVisible && currentStep < steps.length) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        
        // Complete animation after 3 seconds
        setTimeout(() => {
          setIsAnimating(false);
          
          if (currentStep === steps.length - 1) {
            // Last step completed
            setTimeout(() => {
              onComplete();
            }, 500);
          } else {
            // Move to next step
            setTimeout(() => {
              setCurrentStep(prev => prev + 1);
            }, 1000);
          }
        }, 3000);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentStep, isVisible, onComplete]);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            className="w-full max-w-md mx-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Tutorial Header */}
            <div className="text-center mb-6">
              <motion.div
                className="mb-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  Swipe to Manage Payments
                </h2>
                <p className="text-white/80">
                  Learn how to quickly update payment status
                </p>
              </motion.div>

              {/* Step Indicator */}
              <div className="flex justify-center gap-2 mb-4">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index <= currentStep ? "bg-white" : "bg-white/30"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Demo Card */}
            <div className="relative mb-6">
              <motion.div
                className="absolute inset-0 rounded-lg overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: isAnimating ? 1 : 0,
                  backgroundColor: currentStepData.color === 'red' ? '#ef4444' : '#22c55e'
                }}
              >
                <div className={cn(
                  "h-full flex items-center",
                  currentStepData.direction === 'left' ? "justify-start pl-6" : "justify-end pr-6"
                )}>
                  <div className="flex items-center gap-2 text-white">
                    {currentStepData.direction === 'left' ? (
                      <>
                        <XCircle className="h-6 w-6" />
                        <span className="font-semibold">Mark Unpaid</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">Mark Paid</span>
                        <CheckCircle className="h-6 w-6" />
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="relative z-10 bg-card border border-border rounded-lg p-4"
                animate={{
                  x: isAnimating 
                    ? currentStepData.direction === 'left' ? -100 : 100
                    : 0,
                  rotateZ: isAnimating 
                    ? currentStepData.direction === 'left' ? -3 : 3
                    : 0
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 20,
                  duration: 2
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-base">John Doe</h3>
                    <p className="text-sm text-muted-foreground">Room 101</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-sm font-semibold">₹12,000</span>
                      <Badge variant="secondary" className="text-xs">Pending</Badge>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <currentStepData.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>

              {/* Animated Hand */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: isAnimating ? 1 : 0,
                  scale: isAnimating ? 1 : 0,
                  x: isAnimating 
                    ? currentStepData.direction === 'left' ? -80 : 80
                    : 0
                }}
                transition={{ 
                  duration: 2.5,
                  ease: "easeInOut"
                }}
              >
                <div className="bg-primary/90 backdrop-blur-sm rounded-full p-3">
                  <Hand className="h-6 w-6 text-primary-foreground" />
                </div>
              </motion.div>
            </div>

            {/* Step Description */}
            <motion.div
              className="text-center mb-6"
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-white/80">
                {currentStepData.description}
              </p>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onSkip}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Skip Tutorial
              </Button>
              <Button
                onClick={onComplete}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Got It!
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSkip}
          className="absolute top-4 right-4 text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </motion.div>
    </AnimatePresence>
  );
};

export default SwipeTutorial;