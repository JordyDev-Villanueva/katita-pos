# -*- coding: utf-8 -*-
"""
KATITA-POS - Generador de Reportes PDF Profesionales
====================================================
Genera reportes PDF con logo, gráficos y diseño ejecutivo.
"""

from io import BytesIO
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os
from decimal import Decimal

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, Image as RLImage, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas

# Para convertir SVG a PNG
try:
    from svglib.svglib import svg2rlg
    from reportlab.graphics import renderPM
    SVG_SUPPORT = True
except ImportError:
    SVG_SUPPORT = False


def convertir_svg_a_imagen(svg_path):
    """
    Convierte un archivo SVG a un objeto Image de ReportLab.

    Args:
        svg_path: Ruta al archivo SVG

    Returns:
        RLImage o None si no se pudo convertir
    """
    if not os.path.exists(svg_path):
        return None

    if SVG_SUPPORT:
        try:
            # Usar svglib para convertir SVG a drawing de ReportLab
            drawing = svg2rlg(svg_path)
            if drawing:
                # Convertir a PNG en memoria
                img_buffer = BytesIO()
                renderPM.drawToFile(drawing, img_buffer, fmt='PNG', dpi=150)
                img_buffer.seek(0)

                # Crear imagen de ReportLab con tamaño fijo
                img = RLImage(img_buffer, width=0.8*inch, height=0.8*inch)
                return img
        except Exception as e:
            print(f"⚠️ No se pudo convertir SVG con svglib: {e}")
            return None

    return None


def crear_grafico_metodos_pago(metodos_data):
    """Crea un gráfico de pie para métodos de pago y retorna buffer"""
    if not metodos_data:
        return None

    fig, ax = plt.subplots(figsize=(6, 4), facecolor='white')

    metodos = [m['metodo'].upper() for m in metodos_data]
    totales = [float(m['total']) for m in metodos_data]

    colors_chart = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    explode = [0.05] * len(metodos)

    wedges, texts, autotexts = ax.pie(
        totales,
        labels=metodos,
        autopct='%1.1f%%',
        colors=colors_chart[:len(metodos)],
        explode=explode,
        shadow=True,
        startangle=90,
        textprops={'fontsize': 10, 'weight': 'bold'}
    )

    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontsize(11)
        autotext.set_weight('bold')

    ax.set_title('Distribución por Método de Pago', fontsize=13, weight='bold', pad=15)

    # Guardar en buffer
    buffer = BytesIO()
    plt.tight_layout()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    buffer.seek(0)

    return buffer


def crear_grafico_top_productos(top_productos):
    """Crea un gráfico de barras horizontales para top productos y retorna buffer"""
    if not top_productos:
        return None

    fig, ax = plt.subplots(figsize=(7, 5), facecolor='white')

    # Tomar solo top 5 para que se vea mejor
    top_5 = top_productos[:5]
    nombres = [p['nombre'][:25] + '...' if len(p['nombre']) > 25 else p['nombre'] for p in top_5]
    totales = [float(p['total']) for p in top_5]

    # Invertir para que el #1 esté arriba
    nombres.reverse()
    totales.reverse()

    bars = ax.barh(nombres, totales, color='#10b981', edgecolor='#059669', linewidth=1.5)

    # Agregar valores al final de cada barra
    for i, (bar, val) in enumerate(zip(bars, totales)):
        ax.text(val + max(totales) * 0.02, i, f'S/ {val:.2f}',
                va='center', fontsize=10, weight='bold', color='#047857')

    ax.set_xlabel('Total Vendido (S/)', fontsize=11, weight='bold')
    ax.set_title('Top 5 Productos Más Vendidos', fontsize=13, weight='bold', pad=15)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='x', alpha=0.3, linestyle='--')

    # Guardar en buffer
    buffer = BytesIO()
    plt.tight_layout()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    buffer.seek(0)

    return buffer


def crear_grafico_vendedores(ventas_por_vendedor):
    """Crea un gráfico de barras para ventas por vendedor y retorna buffer"""
    if not ventas_por_vendedor or len(ventas_por_vendedor) == 0:
        return None

    fig, ax = plt.subplots(figsize=(7, 4), facecolor='white')

    vendedores = [v['vendedor_nombre'][:20] for v in ventas_por_vendedor]
    totales = [float(v['total']) for v in ventas_por_vendedor]

    bars = ax.bar(vendedores, totales, color='#3b82f6', edgecolor='#1e40af', linewidth=1.5)

    # Agregar valores encima de cada barra
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + max(totales) * 0.02,
                f'S/ {height:.2f}',
                ha='center', va='bottom', fontsize=10, weight='bold')

    ax.set_ylabel('Total Vendido (S/)', fontsize=11, weight='bold')
    ax.set_title('Ventas por Vendedor', fontsize=13, weight='bold', pad=15)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3, linestyle='--')

    # Rotar etiquetas si son muchas
    if len(vendedores) > 3:
        plt.xticks(rotation=45, ha='right')

    # Guardar en buffer
    buffer = BytesIO()
    plt.tight_layout()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.close()
    buffer.seek(0)

    return buffer


def generar_pdf_profesional(
    fecha_inicio,
    fecha_fin,
    ventas,
    total_vendido,
    ganancia_total,
    total_unidades,
    margen_porcentaje,
    top_productos,
    metodo_mas_usado,
    hora_pico,
    comparacion,
    metodos_data,
    vendedores_data
):
    """
    Genera un PDF profesional con logo, gráficos y diseño ejecutivo.

    Returns:
        BytesIO: Buffer con el PDF generado
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=0.4*inch,
        bottomMargin=0.4*inch,
        leftMargin=0.6*inch,
        rightMargin=0.6*inch
    )
    elements = []

    # ===== ESTILOS =====
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=8,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER,
        spaceAfter=15
    )

    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold',
        borderColor=colors.HexColor('#1e40af'),
        borderWidth=0,
        borderPadding=5
    )

    # ===== HEADER CON LOGO =====
    # Intentar primero PNG (más confiable), luego SVG
    logo_path_png = os.path.join('app', 'static', 'logo.png')
    logo_path_svg = os.path.join('app', 'static', 'logo.svg')

    logo_img = None
    if os.path.exists(logo_path_png):
        try:
            logo_img = RLImage(logo_path_png, width=0.8*inch, height=0.8*inch)
        except Exception as e:
            print(f"⚠️ No se pudo cargar logo PNG: {e}")

    if not logo_img:
        logo_img = convertir_svg_a_imagen(logo_path_svg)

    if logo_img:
        # Crear tabla para poner logo al lado del título
        header_data = [
            [
                logo_img,
                Paragraph('KATITA POS<br/><font size="11" color="#6b7280">Sistema de Punto de Venta - Minimarket Guadalupito</font>', title_style)
            ]
        ]

        header_table = Table(header_data, colWidths=[1.2*inch, 5*inch])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))

        elements.append(header_table)
    else:
        # Si no hay logo, usar el header tradicional
        elements.append(Paragraph('KATITA POS', title_style))
        elements.append(Paragraph('Sistema de Punto de Venta - Minimarket Guadalupito', subtitle_style))

    # Título principal
    elements.append(Paragraph('Reporte de Ventas', section_title_style))

    # Período
    periodo_text = f'<b>Período:</b> {fecha_inicio.strftime("%d/%m/%Y")} - {fecha_fin.strftime("%d/%m/%Y")}'
    elements.append(Paragraph(periodo_text, styles['Normal']))
    elements.append(Spacer(1, 0.2*inch))

    # ===== MÉTRICAS PRINCIPALES (Cards visuales) =====
    metricas_data = [
        [
            Paragraph('<b>Total de Ventas</b>', styles['Normal']),
            Paragraph('<b>Total Vendido</b>', styles['Normal']),
            Paragraph('<b>Ganancia Total</b>', styles['Normal'])
        ],
        [
            Paragraph(f'<font size=16 color="#3b82f6"><b>{len(ventas)}</b></font> ventas', styles['Normal']),
            Paragraph(f'<font size=16 color="#10b981"><b>S/ {total_vendido:.2f}</b></font>', styles['Normal']),
            Paragraph(f'<font size=16 color="#8b5cf6"><b>S/ {ganancia_total:.2f}</b></font>', styles['Normal'])
        ]
    ]

    metricas_table = Table(metricas_data, colWidths=[2.3*inch, 2.3*inch, 2.3*inch])
    metricas_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
        ('BACKGROUND', (0, 1), (-1, 1), colors.white),
        ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#e5e7eb')),
        ('INNERGRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(metricas_table)
    elements.append(Spacer(1, 0.2*inch))

    # ===== RESUMEN DETALLADO =====
    ticket_promedio = (total_vendido / len(ventas)) if len(ventas) > 0 else 0

    resumen_data = [
        ['INDICADORES CLAVE', ''],
        ['Margen de Ganancia:', f'{margen_porcentaje:.1f}%'],
        ['Ticket Promedio:', f'S/ {ticket_promedio:.2f}'],
        ['Unidades Vendidas:', f'{total_unidades} unidades'],
        ['Método Más Usado:', metodo_mas_usado],
        ['Hora Pico:', hora_pico],
        ['Comparación:', comparacion]
    ]

    resumen_table = Table(resumen_data, colWidths=[3.5*inch, 3.3*inch])
    resumen_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f9fafb')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#1e40af')),
        ('INNERGRID', (0, 1), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))

    elements.append(resumen_table)
    elements.append(Spacer(1, 0.25*inch))

    # ===== GRÁFICOS =====
    # Gráfico de métodos de pago
    if metodos_data:
        elements.append(Paragraph('Análisis por Método de Pago', section_title_style))
        grafico_metodos = crear_grafico_metodos_pago(metodos_data)
        if grafico_metodos:
            img_metodos = RLImage(grafico_metodos, width=4.5*inch, height=3*inch)
            elements.append(img_metodos)
            elements.append(Spacer(1, 0.2*inch))

    # Gráfico de top productos
    if top_productos:
        elements.append(PageBreak())  # Nueva página para gráficos
        elements.append(Paragraph('Top 5 Productos Más Vendidos', section_title_style))
        grafico_productos = crear_grafico_top_productos(top_productos)
        if grafico_productos:
            img_productos = RLImage(grafico_productos, width=5.5*inch, height=3.5*inch)
            elements.append(img_productos)
            elements.append(Spacer(1, 0.2*inch))

    # Gráfico de vendedores
    if vendedores_data and len(vendedores_data) > 0:
        elements.append(Paragraph('Ventas por Vendedor', section_title_style))
        grafico_vendedores = crear_grafico_vendedores(vendedores_data)
        if grafico_vendedores:
            img_vendedores = RLImage(grafico_vendedores, width=5.5*inch, height=3*inch)
            elements.append(img_vendedores)
            elements.append(Spacer(1, 0.2*inch))

    # ===== TOP 10 PRODUCTOS (Tabla) =====
    elements.append(PageBreak())
    elements.append(Paragraph('Top 10 Productos Más Vendidos', section_title_style))

    top_data = [['#', 'Producto', 'Cant.', 'Total', 'Ganancia']]
    for idx, prod in enumerate(top_productos[:10], 1):
        top_data.append([
            str(idx),
            prod['nombre'][:35],
            str(prod['cantidad']),
            f"S/ {float(prod['total']):.2f}",
            f"S/ {float(prod['ganancia']):.2f}"
        ])

    top_table = Table(top_data, colWidths=[0.4*inch, 3*inch, 0.8*inch, 1.2*inch, 1.2*inch])
    top_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#16a34a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 1), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f0fdf4')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#16a34a')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#86efac')),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]))

    elements.append(top_table)
    elements.append(Spacer(1, 0.25*inch))

    # ===== DETALLE DE VENTAS =====
    if ventas:
        elements.append(PageBreak())
        elements.append(Paragraph('Detalle de Ventas', section_title_style))

        # Limitar a primeras 50 ventas para no hacer el PDF muy largo
        ventas_mostrar = ventas[:50]

        ventas_data = [['Fecha', 'ID', 'Método', 'Vendedor', 'Total', 'Ganancia']]

        for venta in ventas_mostrar:
            vendedor_nombre = venta.vendedor.nombre_completo if venta.vendedor else 'N/A'
            vendedor_nombre = vendedor_nombre[:15]  # Truncar si es muy largo

            ventas_data.append([
                venta.created_at.strftime('%d/%m %H:%M'),
                f'#{venta.id}',
                venta.metodo_pago.upper()[:10],
                vendedor_nombre,
                f'S/ {venta.total:.2f}',
                f'S/ {venta.ganancia_total:.2f}'
            ])

        ventas_table = Table(ventas_data, colWidths=[1*inch, 0.5*inch, 1*inch, 1.5*inch, 1*inch, 1*inch])
        ventas_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#1e40af')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('TOPPADDING', (0, 1), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ]))

        elements.append(ventas_table)

        if len(ventas) > 50:
            nota = Paragraph(
                f'<i>Nota: Se muestran las primeras 50 de {len(ventas)} ventas totales</i>',
                styles['Italic']
            )
            elements.append(Spacer(1, 0.1*inch))
            elements.append(nota)

    # ===== FOOTER =====
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER
    )

    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(
        f'Generado el {datetime.now().strftime("%d/%m/%Y %H:%M")} | KATITA POS v1.0',
        footer_style
    ))

    # Generar PDF
    doc.build(elements)
    buffer.seek(0)

    return buffer


from datetime import datetime
