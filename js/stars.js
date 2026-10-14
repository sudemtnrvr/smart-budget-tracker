function generateStars() {
    const starCounts = {
        large: 80,
        medium: 150,
        small: 300
    };
    
    const gradients = [];
    
    for (let i = 0; i < starCounts.large; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        gradients.push(`radial-gradient(2px 2px at ${x}% ${y}%, white, transparent)`);
    }
    
    for (let i = 0; i < starCounts.medium; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        gradients.push(`radial-gradient(1.5px 1.5px at ${x}% ${y}%, white, transparent)`);
    }
    
    for (let i = 0; i < starCounts.small; i++) {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        gradients.push(`radial-gradient(1px 1px at ${x}% ${y}%, white, transparent)`);
    }
    
    const style = document.createElement('style');
    style.textContent = `
        body::after {
            background-image: ${gradients.join(',\n        ')};
        }
    `;
    document.head.appendChild(style);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', generateStars);
} else {
    generateStars();
}

