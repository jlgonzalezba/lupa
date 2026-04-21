import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import 'lupa_model.dart';

class LupaForm extends StatelessWidget {
  final LupaModel model;
  final GlobalKey<FormState> formKey;

  const LupaForm({
    super.key,
    required this.model,
    required this.formKey,
  });

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [
          const SizedBox(height: 16),
          _buildLabel('Título', required: true),
          _buildTextField(
            controller: model.tituloController,
            hintText: 'Ingrese el título del reporte...',
            validator: model.validateTitulo,
          ),
          const SizedBox(height: 16),
          _buildLabel('Ubicación', required: true),
          _buildDropdown(
            value: model.ubicacion,
            items: model.ubicaciones,
            hintText: 'Seleccione ubicación',
            onChanged: model.setUbicacion,
          ),
          const SizedBox(height: 16),
          _buildLabel('Tipo de Evento', required: true),
          _buildTextField(
            controller: model.tipoEventoController,
            hintText: 'Ej: Incidente, Accidente, Observación...',
            validator: model.validateTipoEvento,
          ),
          const SizedBox(height: 16),
          _buildLabel('Descripción', required: true),
          _buildTextField(
            controller: model.descripcionController,
            hintText: 'Describa detalladamente el evento...',
            validator: model.validateDescripcion,
            maxLines: 5,
          ),
          const SizedBox(height: 16),
          _buildLabel('Acción Tomada', required: true),
          _buildTextField(
            controller: model.accionTomadaController,
            hintText: 'Describa las acciones correctivas tomadas...',
            validator: model.validateAccionTomada,
            maxLines: 3,
          ),
          const SizedBox(height: 16),
          _buildLabel('Fecha', required: true),
          _buildDatePicker(context),
          const SizedBox(height: 16),
          _buildLabel('Etiqueta', required: false),
          _buildDropdown(
            value: model.etiqueta,
            items: model.etiquetas,
            hintText: 'Seleccione etiqueta (opcional)',
            onChanged: model.setEtiqueta,
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildLabel(String text, {required bool required}) {
    return Row(
      children: [
        Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        if (required)
          Text(
            ' *',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppTheme.error,
            ),
          ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    required String? Function(String?)? validator,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      validator: validator,
      maxLines: maxLines,
      style: GoogleFonts.inter(color: AppTheme.textPrimary),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: GoogleFonts.inter(color: AppTheme.textHint),
      ),
    );
  }

  Widget _buildDropdown({
    required String? value,
    required List<String> items,
    required String hintText,
    required void Function(String?) onChanged,
  }) {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.borderColor),
      ),
      child: DropdownButtonHideUnderline(
        child: ButtonTheme(
          alignedDropdown: true,
          child: DropdownButton<String>(
            value: value,
            items: items.map((item) {
              return DropdownMenuItem(
                value: item,
                child: Text(item,
                    style: GoogleFonts.inter(color: AppTheme.textPrimary)),
              );
            }).toList(),
            hint: Text(hintText,
                style: GoogleFonts.inter(color: AppTheme.textHint)),
            dropdownColor: AppTheme.cardColor,
            isExpanded: true,
            icon: const Icon(Icons.keyboard_arrow_down,
                color: AppTheme.textSecondary),
            onChanged: onChanged,
          ),
        ),
      ),
    );
  }

  Widget _buildDatePicker(BuildContext context) {
    final dateText = model.fecha != null
        ? DateFormat('dd/MM/yyyy').format(model.fecha!)
        : 'Seleccionar fecha';

    return InkWell(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: model.fecha ?? DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime.now(),
          builder: (context, child) {
            return Theme(
              data: ThemeData.dark().copyWith(
                colorScheme: const ColorScheme.dark(
                  primary: AppTheme.primary,
                  onPrimary: AppTheme.textPrimary,
                  surface: AppTheme.cardColor,
                  onSurface: AppTheme.textPrimary,
                ),
              ),
              child: child!,
            );
          },
        );
        if (picked != null) {
          model.setFecha(picked);
        }
      },
      child: Container(
        height: 52,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.borderColor),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              dateText,
              style: GoogleFonts.inter(
                color: model.fecha != null
                    ? AppTheme.textPrimary
                    : AppTheme.textHint,
              ),
            ),
            const Icon(Icons.calendar_today,
                color: AppTheme.textSecondary, size: 20),
          ],
        ),
      ),
    );
  }
}
