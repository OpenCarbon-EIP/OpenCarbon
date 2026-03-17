import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/profile/data/models/profile_model.dart';
import 'package:flutter_poc/features/profile/data/services/profile_api_service.dart';
import 'package:flutter_poc/features/profile/data/services/profile_auth_service.dart';
import 'package:flutter_poc/features/profile/domain/entity/profile_entity.dart';

abstract class ProfileRepository {
  Future<Profile> getProfile();

  Future<void> updatePassword(String userId, String password);

  Future<void> updateEmail(String userId, String email);

  Future<void> updateFirstAndLastName(String userId, String firstName, String lastName);
}

class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl(this._api, this._authService);

  final ProfileApiService _api;
  final ProfileAuthService _authService;

  @override
  Future<Profile> getProfile() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw AuthFailure("Le token n'est pas valable");
      }
      final ProfileModel response = await _api.getProfile(token);
      final ProfileDataModel? profileData = response.data;
      if (profileData == null) {
        throw UnauthorizedFailure();
      }

      return Profile(
        id: profileData.id,
        email: profileData.email,
        role: profileData.role,
        consultantData: (profileData.consultantData != null
            ? ConsultantData(
                firstName: profileData.consultantData!.firstName,
                lastName: profileData.consultantData!.lastName,
                professionalTitle: profileData.consultantData!.professionalTitle,
                description: profileData.consultantData!.description,
                photoUrl: profileData.consultantData!.photoUrl,
                ratingScore: profileData.consultantData!.ratingScore,
                isVerified: profileData.consultantData!.isVerified,
              )
            : null),
        companyData: profileData.companyData != null
            ? CompanyData(
                companyName: profileData.companyData!.companyName,
                industrySector: profileData.companyData?.industrySector ?? '',
                companySize: profileData.companyData!.companySize,
                description: profileData.companyData!.description,
                logoUrl: profileData.companyData!.logoUrl,
              )
            : null,
      );
    } on UnauthorizedFailure catch (_) {
      rethrow;
    } on Exception catch (_) {
      rethrow;
    }
  }

  @override
  Future<void> updatePassword(String userId, String password) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw AuthFailure("Le token n'est pas valable");
      }
      await _api.updatePassword(token, userId, password);
    } on UnauthorizedFailure catch (_) {
      rethrow;
    } on Exception catch (_) {
      rethrow;
    }
  }

  @override
  Future<void> updateEmail(String userId, String email) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw AuthFailure("Le token n'est pas valable");
      }
      await _api.updateEmail(token, userId, email);
    } on UnauthorizedFailure catch (_) {
      rethrow;
    } on Exception catch (_) {
      rethrow;
    }
  }

  @override
  Future<void> updateFirstAndLastName(String userId, String firstName, String lastName) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw AuthFailure("Le token n'est pas valable");
      }
      await _api.updateFirstAndLastName(token, userId, firstName, lastName);
    } on UnauthorizedFailure catch (_) {
      rethrow;
    } on Exception catch (_) {
      rethrow;
    }
  }
}
