import 'package:flutter/material.dart';

class AppSizes {
  AppSizes._();

  // Espacements de base (double)
  static const double p8 = 8.0;
  static const double p16 = 16.0;

  // Raccourcis pour les EdgeInsets
  static const EdgeInsets paddingSmall = EdgeInsets.all(p8);
  static const EdgeInsets paddingMedium = EdgeInsets.symmetric(horizontal: p16, vertical: p8);
  
  // Rayons de bordure
  static const double radiusMedium = 16.0;
}
