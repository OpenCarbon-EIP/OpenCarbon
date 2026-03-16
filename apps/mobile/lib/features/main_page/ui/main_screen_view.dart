import 'package:flutter/material.dart';
import 'package:flutter_poc/core/colors/app_colors.dart';
import 'package:flutter_poc/features/dashboard/ui/dashboard.dart';
import 'package:flutter_poc/features/messages/ui/messages_view.dart';
import 'package:flutter_poc/features/offers/ui/offers_view.dart';
import 'package:flutter_poc/features/profile/ui/profile_view.dart';
import 'package:flutter_poc/ui/widgets/app_navbar.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _views = [
    const Dashboard(),
    const OffersView(),
    const MessagesView(),
    const ProfileView(),
  ];

  @override
  Widget build(BuildContext context) => Scaffold(
    extendBody: true,
    backgroundColor: AppColors.backgroundLight,
    body: _views[_currentIndex],
    bottomNavigationBar: AppNavbar(
      selectedIndex: _currentIndex,
      onItemSelected: (index) {
        setState(() {
          _currentIndex = index;
        });
      },
    ),
  );
}
