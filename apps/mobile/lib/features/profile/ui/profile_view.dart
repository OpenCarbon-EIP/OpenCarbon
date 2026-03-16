import 'package:flutter/material.dart';
import 'package:flutter_poc/core/colors/app_colors.dart';
import 'package:flutter_poc/core/svg/app_svg.dart';
import 'package:flutter_poc/core/typo/app_typography.dart';
import 'package:flutter_poc/features/profile/data/repositories/profile_repository.dart';
import 'package:flutter_poc/features/profile/data/services/profile_api_service.dart';
import 'package:flutter_poc/features/profile/data/services/profile_auth_service.dart';
import 'package:flutter_poc/features/profile/ui/setting_view.dart';
import 'package:flutter_poc/features/profile/viewmodels/profile_viewmodel.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

class ProfileView extends StatelessWidget {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context) => Provider<http.Client>(
    create: (_) => http.Client(),
    dispose: (_, client) => client.close(),
    child: ChangeNotifierProvider(
      create: (context) {
        const iosOptions = IOSOptions(accessibility: KeychainAccessibility.first_unlock);
        const auth = FlutterSecureStorage(iOptions: iosOptions);
        final service = ProfileApiService(context.read<http.Client>());
        final authService = ProfileAuthService(auth);
        final repository = ProfileRepositoryImpl(service, authService);
        final vm = ProfileViewModel(repository);
        vm.fetchProfile();
        return vm;
      },
      child: const _ProfileViewBody(),
    ),
  );
}

class _ProfileViewBody extends StatefulWidget {
  const _ProfileViewBody();

  @override
  State<_ProfileViewBody> createState() => _ProfileViewBodyState();
}

class _ProfileViewBodyState extends State<_ProfileViewBody> {
  @override
  Widget build(BuildContext context) {
    final vm = context.watch<ProfileViewModel>();
    final profile = vm.profile;

    if (vm.isLoading) {
      return const LinearProgressIndicator();
    }

    final isConsultant = profile?.consultantData != null;

    final displayName = isConsultant
        ? '${profile!.consultantData!.firstName} ${profile.consultantData!.lastName}'
        : profile?.companyData?.companyName ?? 'Utilisateur';

    final displayImage = isConsultant ? profile?.consultantData?.photoUrl : profile?.companyData?.logoUrl;
    final displayDescription = isConsultant ? profile?.consultantData?.description : profile?.companyData?.description;

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 46),
        child: Column(
          spacing: 32,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Text(
                    displayName.toUpperCase(),
                    style: AppTypography.headingLarge.copyWith(color: AppColors.primaryLight),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    if (profile == null) return;
                    Navigator.push(
                      context,
                      MaterialPageRoute<void>(builder: (context) => SettingView(profile: profile, viewModel: vm)),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primaryLight),
                    ),
                    child: SvgPicture.string(
                      AppSvg.svgSettingStroke,
                      colorFilter: const ColorFilter.mode(AppColors.primaryLight, BlendMode.srcIn),
                    ),
                  ),
                ),
              ],
            ),
            Center(
              child: SizedBox(
                height: 296,
                width: 300,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Image.network(
                    displayImage ?? '',
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => const ColoredBox(color: Colors.grey),
                  ),
                ),
              ),
            ),
            Column(
              spacing: 10,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Description', style: AppTypography.subheadingMedium.copyWith(color: AppColors.primaryLight)),
                Text(
                  displayDescription ?? 'Aucune description.',
                  style: AppTypography.bodySmall.copyWith(color: AppColors.primaryLight),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
