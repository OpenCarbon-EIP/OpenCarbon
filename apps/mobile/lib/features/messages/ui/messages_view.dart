import 'package:flutter/material.dart';
import 'package:flutter_poc/core/typo/app_typography.dart';

class MessagesView extends StatelessWidget {
  const MessagesView({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Padding(
      padding: const EdgeInsets.all(32.0),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          spacing: 24,
          children: [
            Text(
              "Cette option arrive bientôt, naviguez vers la page opportunités ou profil pour commencer à découvrir l'app !",
              style: AppTypography.subheadingMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    ),
  );
}
