import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTypography {
  AppTypography._();

  static TextStyle get displayExtraLarge =>
      GoogleFonts.anton(fontSize: 48);
  static TextStyle get displayLarge => GoogleFonts.anton(fontSize: 40);
  static TextStyle get headingLarge => GoogleFonts.anton(fontSize: 32);
  static TextStyle get headingMedium => GoogleFonts.anton(fontSize: 28);
  static TextStyle get headingSmall => GoogleFonts.anton(fontSize: 24);
  static TextStyle get subheadingLarge => GoogleFonts.poppins(fontSize: 20);
  static TextStyle get subheadingMedium => GoogleFonts.poppins(fontSize: 18);
  static TextStyle get subheadingSmall => GoogleFonts.poppins(fontSize: 16);
  static TextStyle get bodyMedium => GoogleFonts.poppins(fontSize: 16);
  static TextStyle get bodySmall => GoogleFonts.poppins(fontSize: 14);
  static TextStyle get caption =>
      GoogleFonts.poppins(fontSize: 12, fontStyle: FontStyle.italic);
  static TextStyle get label => GoogleFonts.poppins(fontSize: 12);
}
