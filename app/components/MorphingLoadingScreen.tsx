import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const COLORS = {
  darkBlue: '#15292E',
  mint: '#1DA27E',
  teal: '#108585',
};

interface MorphingLoadingScreenProps {
  visible: boolean;
}

export default function MorphingLoadingScreen({ visible }: MorphingLoadingScreenProps) {
  const hop1 = useRef(new Animated.Value(0)).current;
  const hop2 = useRef(new Animated.Value(0)).current;
  const hop3 = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = React.useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (visible) {
      // Show immediately
      setShouldRender(true);
      
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();

      const createHopAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: -20,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ]);
      };

      Animated.loop(
        Animated.parallel([
          createHopAnimation(hop1, 0),
          createHopAnimation(hop2, 200),
          createHopAnimation(hop3, 400),
        ])
      ).start();
    } else {
      // Fade out and delay unmount
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      
      timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Minimum display time
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, hop1, hop2, hop3, opacity]);

  if (!shouldRender) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.triangleContainer}>
        <Animated.View
          style={[
            styles.triangle,
            {
              transform: [{ translateY: hop1 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.triangle,
            {
              transform: [{ translateY: hop2 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.triangle,
            {
              transform: [{ translateY: hop3 }],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.darkBlue,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  triangleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 15,
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 26,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.mint,
  },
});
