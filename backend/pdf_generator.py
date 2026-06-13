from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from io import BytesIO
from typing import List

def create_bar_chart(data, labels):
    drawing = Drawing(400, 200)
    bc = VerticalBarChart()
    bc.x = 50
    bc.y = 50
    bc.height = 125
    bc.width = 300
    bc.data = [data]
    bc.strokeColor = colors.white
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = 100
    bc.valueAxis.valueStep = 20
    bc.categoryAxis.labels.boxAnchor = 'ne'
    bc.categoryAxis.labels.dx = 8
    bc.categoryAxis.labels.dy = -2
    bc.categoryAxis.labels.angle = 30
    bc.categoryAxis.categoryNames = labels
    bc.bars[0].fillColor = colors.HexColor("#3b82f6")
    drawing.add(bc)
    return drawing

def generate_pdf(analysis_data: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor("#1e40af"), alignment=1)
    section_style = ParagraphStyle('SectionStyle', parent=styles['Heading2'], fontSize=18, textColor=colors.HexColor("#1e293b"), spaceBefore=15)
    body_style = styles["BodyText"]
    
    elements = []
    # Brand Header (Simulated branding)
    elements.append(Paragraph("ADVANTAGE AI", ParagraphStyle('B', parent=title_style, fontSize=10, textColor=colors.grey, alignment=0)))
    elements.append(Paragraph("Creative Audit & Strategy Report", title_style))
    elements.append(Spacer(1, 24))
    
    scoring = analysis_data.get("scoring", {})
    elements.append(Paragraph(f"Executive Summary: {scoring.get('grade', 'N/A')} Grade", section_style))
    elements.append(Paragraph(f"Score: {scoring.get('overall_score', 'N/A')}/100", body_style))
    elements.append(Paragraph(f"Strategic Verdict: {scoring.get('verdict', 'N/A')}", body_style))
    elements.append(Spacer(1, 12))
    
    # 1. Visual Audit
    visual = analysis_data.get("visual_analysis", {})
    elements.append(Paragraph("1. Visual Intelligence Audit", section_style))
    visual_items = [
        ["Objects Detected", ", ".join(visual.get("objects_detected", []))],
        ["Dominant Colors", ", ".join(visual.get("dominant_colors", []))],
        ["Text Layer Ratio", f"{visual.get('text_ratio_percent', 0)}%"],
        ["Hierarchy Score", f"{visual.get('visual_hierarchy_score', 0)}%"]
    ]
    t = Table(visual_items, colWidths=[150, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f8fafc")),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t)
    
    # 2. Platform Fit Chart
    fit = analysis_data.get("platform_fit_scores", {})
    elements.append(Paragraph("2. Omni-Channel Platform Fit", section_style))
    labels = [k.replace('_', ' ').title() for k in fit.keys()]
    data = [float(v) for v in fit.values()]
    chart = create_bar_chart(data, labels)
    elements.append(chart)
    elements.append(Spacer(1, 12))
    
    # 3. Strategy Checklist
    feedback = analysis_data.get("feedback_checklist", {})
    elements.append(Paragraph("3. Strategic Action Plan", section_style))
    
    high_p = feedback.get("high_priority", [])
    if high_p:
        elements.append(Paragraph("CRITICAL / HIGH PRIORITY:", ParagraphStyle('HB', parent=body_style, fontName='Helvetica-Bold', textColor=colors.red)))
        for item in high_p:
            elements.append(Paragraph(f"• {item}", body_style))
        elements.append(Spacer(1, 8))
        
    med_p = feedback.get("medium_priority", [])
    if med_p:
        elements.append(Paragraph("MEDIUM PRIORITY / OPTIMIZATIONS:", ParagraphStyle('MB', parent=body_style, fontName='Helvetica-Bold', textColor=colors.orange)))
        for item in med_p:
            elements.append(Paragraph(f"• {item}", body_style))
            
    elements.append(Spacer(1, 24))
    elements.append(Paragraph("AdVantage AI — Senior Marketing Auditor. Internal use only.", ParagraphStyle('F', parent=body_style, fontSize=8, textColor=colors.grey, alignment=1)))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

def generate_comparison_pdf(analyses: List[dict]) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('TS', parent=styles['Heading1'], fontSize=22, textColor=colors.HexColor("#1e40af"), alignment=1)
    section_style = ParagraphStyle('SS', parent=styles['Heading2'], fontSize=16, textColor=colors.HexColor("#1e293b"), spaceBefore=12)
    body_style = styles["BodyText"]
    
    elements = []
    elements.append(Paragraph("AdVantage AI: Comparative Audit Report", title_style))
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph("Side-by-Side Performance Matrix", section_style))
    
    # Summary Table Headers
    summary_data = [["Metric", "Variant A", "Variant B", "Variant C"]]
    # We might have up to 5, but let's stick to 3 for clean layout or dynamic sizing
    header_row = ["Metric"] + [f"Variant {chr(65+i)}" for i in range(len(analyses))]
    summary_data = [header_row]
    
    # Rows
    metrics = [
        ("Platform", "platform_rules.platform"),
        ("Overall Score", "scoring.overall_score"),
        ("Visual Score", "scoring.visual_quality_score"),
        ("Copy Strength", "scoring.copy_strength_score"),
        ("Grade", "scoring.grade")
    ]
    
    for label, path in metrics:
        row = [label]
        for analysis in analyses:
            val = analysis
            for p in path.split('.'): val = val.get(p, "N/A") if isinstance(val, dict) else "N/A"
            if isinstance(val, (int, float)): val = f"{val}%"
            row.append(str(val))
        summary_data.append(row)
        
    t_summary = Table(summary_data, colWidths=[100] + [400/len(analyses)]*len(analyses))
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(t_summary)
    elements.append(Spacer(1, 30))
    
    # Details per variant
    for i, analysis in enumerate(analyses):
        elements.append(Paragraph(f"Deep Dive: Variant {chr(65+i)}", section_style))
        scoring = analysis.get("scoring", {})
        elements.append(Paragraph(f"Verdict: {scoring.get('verdict', 'N/A')}", body_style))
        
        # Strategic Check
        high = analysis.get("feedback_checklist", {}).get("high_priority", [])
        if high:
            elements.append(Paragraph(f"Top Fix: {high[0]}", ParagraphStyle('X', parent=body_style, fontSize=9, textColor=colors.red)))
        
        elements.append(Spacer(1, 15))
        
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
