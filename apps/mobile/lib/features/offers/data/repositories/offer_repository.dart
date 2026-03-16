import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/offers/data/models/offer_model.dart';
import 'package:flutter_poc/features/offers/data/services/offer_api_service.dart';
import 'package:flutter_poc/features/offers/data/services/offer_auth_service.dart';
import 'package:flutter_poc/features/offers/domain/entity/offer_entity.dart';

abstract class OfferRepository {
  Future<List<OfferEntity>> getOffers();

  Future<void> apply(String idOffer);

  Future<List<OfferEntity>> getCompanyOffers();

  Future<void> createOffer(String title, String description, String location, double budget, DateTime deadline);

  Future<void> deleteOffer(String idOffer);
}

class OfferRepositoryImpl implements OfferRepository {
  OfferRepositoryImpl(this._api, this._authService);

  final OfferApiService _api;
  final OfferAuthService _authService;

  @override
  Future<List<OfferEntity>> getOffers() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw AuthFailure("Le token n'est pas valable");
      }
      final OfferModel response = await _api.getOffers(token);

      final List<OfferData> dataList = response.data ?? [];

      return dataList
          .map(
            (offer) => OfferEntity(
              id: offer.id,
              title: offer.title,
              description: offer.description,
              budget: offer.budget,
              deadline: DateTime.parse(offer.deadline),
              status: offer.status,
              location: offer.location,
              idCompany: offer.idCompany,
              company: offer.company != null
                  ? CompanyEntity(
                      id: offer.company!.id,
                      companyName: offer.company!.companyName,
                      industrySector: offer.company!.industrySector ?? 'Industrie non spécifiée',
                      companySize: offer.company!.companySize,
                      description: offer.company!.description,
                      logoUrl: offer.company!.logoUrl,
                      idUser: offer.company!.idUser,
                      user: offer.company!.user != null
                          ? UserEntity(
                              id: offer.company!.user!.id,
                              email: offer.company!.user!.email,
                              role: offer.company!.user!.role,
                            )
                          : null,
                    )
                  : null,
            ),
          )
          .toList();
    } on AuthFailure catch (_) {
      rethrow;
    } on Exception catch (e) {
      throw Exception('Failed to load offers: ${e.toString()}');
    }
  }

  @override
  Future<void> apply(String idOffer) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw AuthFailure("Le token n'est pas valable");
      }

      await _api.apply(token, idOffer);
    } on UnauthorizedFailure catch (_) {
      rethrow;
    } on AuthFailure catch (_) {
      rethrow;
    } on NotFoundFailure catch (_) {
      rethrow;
    } on Exception catch (_) {
      rethrow;
    }
  }

  @override
  Future<List<OfferEntity>> getCompanyOffers() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw AuthFailure("Le token n'est pas valable");
      }
      final OfferModel response = await _api.getCompanyOffers(token);

      final List<OfferData> dataList = response.data ?? [];

      return dataList
          .map(
            (offer) => OfferEntity(
              id: offer.id,
              title: offer.title,
              description: offer.description,
              budget: offer.budget,
              deadline: DateTime.parse(offer.deadline),
              status: offer.status,
              location: offer.location,
              idCompany: offer.idCompany,
              company: offer.company != null
                  ? CompanyEntity(
                      id: offer.company!.id,
                      companyName: offer.company!.companyName,
                      industrySector: offer.company!.industrySector ?? 'Industrie non spécifiée',
                      companySize: offer.company!.companySize,
                      description: offer.company!.description,
                      logoUrl: offer.company!.logoUrl,
                      idUser: offer.company!.idUser,
                      user: offer.company!.user != null
                          ? UserEntity(
                              id: offer.company!.user!.id,
                              email: offer.company!.user!.email,
                              role: offer.company!.user!.role,
                            )
                          : null,
                    )
                  : null,
            ),
          )
          .toList();
    } on AuthFailure catch (_) {
      rethrow;
    } on NotFoundFailure catch (_) {
      rethrow;
    } on Exception catch (e) {
      throw Exception('Failed to load offers: ${e.toString()}');
    }
  }

  @override
  Future<void> createOffer(String title, String description, String location, double budget, DateTime deadline) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw AuthFailure("Le token n'est pas valable");
      }
      await _api.createOffer(token, title, description, location, budget, deadline);
    } on AuthFailure catch (_) {
      rethrow;
    } on NotFoundFailure catch (_) {
      rethrow;
    } on Exception catch (_) {
      rethrow;
    }
  }

  @override
  Future<void> deleteOffer(String idOffer) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw AuthFailure("Le token n'est pas valable");
      }
      await _api.deleteOffer(token, idOffer);
    } on AuthFailure catch (_) {
      rethrow;
    } on NotFoundFailure catch (_) {
      rethrow;
    } on Exception catch (_) {
      rethrow;
    }
  }
}
