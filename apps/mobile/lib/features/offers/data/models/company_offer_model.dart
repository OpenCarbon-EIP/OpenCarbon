import 'package:flutter_poc/features/offers/data/models/offer_model.dart';

class CompanyOfferModel {
  CompanyOfferModel({this.success, this.data, required this.message, this.statusCode});

  factory CompanyOfferModel.fromJson(Map<String, dynamic> json) => CompanyOfferModel(
    success: json['success'] as bool?,
    data: json['data'] != null ? OfferData.fromJson(json['data'] as Map<String, dynamic>) : null,
    message: json['message'] as String,
    statusCode: json['statusCode'] as int?,
  );
  final bool? success;
  final OfferData? data;
  final String message;
  final int? statusCode;
}