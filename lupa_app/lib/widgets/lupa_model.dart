import 'package:flutter/material.dart';

class LupaReport {
  String titulo;
  String ubicacion;
  String tipoEvento;
  String descripcion;
  String accionTomada;
  DateTime? fecha;
  String? etiqueta;

  LupaReport({
    this.titulo = '',
    this.ubicacion = '',
    this.tipoEvento = '',
    this.descripcion = '',
    this.accionTomada = '',
    this.fecha,
    this.etiqueta,
  });

  bool get isValid {
    return titulo.isNotEmpty &&
        ubicacion.isNotEmpty &&
        tipoEvento.isNotEmpty &&
        descripcion.isNotEmpty &&
        accionTomada.isNotEmpty &&
        fecha != null;
  }
}

class LupaModel extends ChangeNotifier {
  final tituloController = TextEditingController();
  final tipoEventoController = TextEditingController();
  final descripcionController = TextEditingController();
  final accionTomadaController = TextEditingController();

  String? _ubicacion;
  String? _etiqueta;
  DateTime? _fecha;

  String? get ubicacion => _ubicacion;
  String? get etiqueta => _etiqueta;
  DateTime? get fecha => _fecha;

  List<String> get ubicaciones => ['Pozo', 'Base', 'Oficina', 'Movilización'];
  List<String> get etiquetas => ['Urgente', 'Cerrado', 'Revisión'];

  void setUbicacion(String? value) {
    _ubicacion = value;
    notifyListeners();
  }

  void setEtiqueta(String? value) {
    _etiqueta = value;
    notifyListeners();
  }

  void setFecha(DateTime? value) {
    _fecha = value;
    notifyListeners();
  }

  LupaReport toReport() {
    return LupaReport(
      titulo: tituloController.text,
      ubicacion: _ubicacion ?? '',
      tipoEvento: tipoEventoController.text,
      descripcion: descripcionController.text,
      accionTomada: accionTomadaController.text,
      fecha: _fecha,
      etiqueta: _etiqueta,
    );
  }

  String? validateTitulo(String? value) {
    if (value == null || value.isEmpty) {
      return 'El título es requerido';
    }
    return null;
  }

  String? validateTipoEvento(String? value) {
    if (value == null || value.isEmpty) {
      return 'El tipo de evento es requerido';
    }
    return null;
  }

  String? validateDescripcion(String? value) {
    if (value == null || value.isEmpty) {
      return 'La descripción es requerida';
    }
    return null;
  }

  String? validateAccionTomada(String? value) {
    if (value == null || value.isEmpty) {
      return 'La acción tomada es requerida';
    }
    return null;
  }

  @override
  void dispose() {
    tituloController.dispose();
    tipoEventoController.dispose();
    descripcionController.dispose();
    accionTomadaController.dispose();
    super.dispose();
  }
}
