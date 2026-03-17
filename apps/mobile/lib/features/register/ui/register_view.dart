import 'package:flutter/material.dart';
import 'package:flutter_poc/core/auth/auth_provider.dart';
import 'package:flutter_poc/core/colors/app_colors.dart';
import 'package:flutter_poc/core/typo/app_typography.dart';
import 'package:flutter_poc/features/register/data/repositories/register_repository.dart';
import 'package:flutter_poc/features/register/data/services/register_api_service.dart';
import 'package:flutter_poc/features/register/data/services/register_auth_service.dart';
import 'package:flutter_poc/features/register/domain/usecases/register_usecase.dart';
import 'package:flutter_poc/features/register/viewmodels/register_viewmodel.dart';
import 'package:flutter_poc/ui/widgets/button.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

final role = {'CONSULTANT': 'Consultant', 'COMPANY': 'Entreprise'};

/// @class RegisterView
/// @brief Widget racine de l'écran d'inscription.
/// * Utilise le pattern Provider pour injecter les dépendances nécessaires au ViewModel.
class RegisterView extends StatelessWidget {
  const RegisterView({super.key, required this.onSwitch});

  final VoidCallback onSwitch;

  @override
  Widget build(BuildContext context) => Provider<http.Client>(
    create: (_) => http.Client(),
    dispose: (_, client) => client.close(),
    child: ChangeNotifierProvider(
      create: (context) {
        final httpClient = http.Client();
        const iosOptions = IOSOptions(accessibility: KeychainAccessibility.first_unlock);
        const auth = FlutterSecureStorage(iOptions: iosOptions);
        final service = RegisterApiService(httpClient);
        final authService = RegisterAuthService(auth);
        final repository = RegisterRepositoryImpl(service, authService);
        final useCase = RegisterUsecase(repository);
        final vm = RegisterViewModel(useCase);
        return vm;
      },
      child: _RegisterViewBody(onSwitch: onSwitch),
    ),
  );
}

class _RegisterViewBody extends StatefulWidget {
  const _RegisterViewBody({required this.onSwitch});

  final VoidCallback onSwitch;

  @override
  State<_RegisterViewBody> createState() => _RegisterViewBodyState();
}

class _RegisterViewBodyState extends State<_RegisterViewBody> {
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  late final TextEditingController _roleController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _lastNameController;
  late final TextEditingController _firstNameController;
  late final TextEditingController _professionalTitleController;
  late final TextEditingController _companyNameController;
  late final TextEditingController _companySizeController;
  String _selectedRole = '';

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _roleController = TextEditingController();
    _descriptionController = TextEditingController();
    _lastNameController = TextEditingController();
    _firstNameController = TextEditingController();
    _professionalTitleController = TextEditingController();
    _companyNameController = TextEditingController();
    _companySizeController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _roleController.dispose();
    _descriptionController.dispose();
    _lastNameController.dispose();
    _firstNameController.dispose();
    _professionalTitleController.dispose();
    _companyNameController.dispose();
    _companySizeController.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<RegisterViewModel>();

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          children: [
            const SizedBox(height: 80),

            Column(
              mainAxisSize: MainAxisSize.min,
              spacing: 16,
              children: [
                TextField(
                  controller: _firstNameController,
                  decoration: const InputDecoration(labelText: 'Prénom'),
                ),
                TextField(
                  controller: _lastNameController,
                  decoration: const InputDecoration(labelText: 'Nom'),
                ),
                TextField(
                  controller: _emailController,
                  decoration: const InputDecoration(labelText: 'Email'),
                ),
                TextField(
                  controller: _passwordController,
                  decoration: const InputDecoration(labelText: 'Mot de passe'),
                  obscureText: true,
                ),
                ConstrainedBox(
                  constraints: const BoxConstraints(minWidth: 180),
                  child: ShadSelect<String>(
                    placeholder: const Text('Choisissez votre rôle'),
                    options: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                        child: Text('Rôle', style: AppTypography.bodySmall),
                      ),
                      ...role.entries.map((e) => ShadOption(value: e.key, child: Text(e.value))),
                    ],
                    selectedOptionBuilder: (context, value) => Text(role[value]!),
                    onChanged: (v) {
                      setState(() {
                        _selectedRole = v ?? '';
                        _roleController.text = _selectedRole;
                        if (_selectedRole != 'COMPANY') {
                          _companyNameController.clear();
                          _companySizeController.clear();
                        }
                      });
                    },
                  ),
                ),
                TextField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(labelText: 'Description'),
                ),

                TextField(
                  controller: _professionalTitleController,
                  decoration: const InputDecoration(labelText: 'Titre professionnel'),
                ),
                if (_selectedRole == 'COMPANY')
                  TextField(
                    controller: _companyNameController,
                    decoration: const InputDecoration(labelText: 'Nom de l\'entreprise'),
                  ),
                if (_selectedRole == 'COMPANY')
                  TextField(
                    controller: _companySizeController,
                    decoration: const InputDecoration(labelText: 'Taille de l\'entreprise'),
                  ),

                if (vm.error != null) Text(vm.error!, style: const TextStyle(color: Colors.red)),
              ],
            ),

            const SizedBox(height: 32),

            SafeArea(
              top: false,
              child: Column(
                children: [
                  vm.isLoading
                      ? const CircularProgressIndicator()
                      : SmallButton(
                          color: AppColors.primaryLight,
                          text: 'S\'inscrire',
                          onPressed: () async {
                            await vm.signup(
                              _emailController.text,
                              _passwordController.text,
                              _roleController.text,
                              _descriptionController.text,
                              _lastNameController.text,
                              _firstNameController.text,
                              _professionalTitleController.text,
                              _companyNameController.text,
                              int.tryParse(_companySizeController.text) ?? 1,
                            );
                            if (context.mounted && vm.error == null) {
                              await context.read<AuthProvider>().loginSuccess();
                            }
                          },
                        ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: widget.onSwitch,
                    child: const Text('Vous avez déjà un compte ? Connectez-vous'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
